'use client';

import { ChangeEvent, FormEvent, useCallback, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CadSplitViewer } from '@/components/cad/CadSplitViewer';
import { CADAnalysisResults } from '@/components/cad/CADAnalysisResults';
import { useSplitAssembly } from '@/hooks/cad/useSplitAssembly';
import { useAnalyzeCAD } from '@/hooks/cad/useAnalyzeCAD';
import { submitToRequestQueue } from '@/services/LLM/requestQueue';
import type { OrdersSchema } from '@/types/schemas';

interface CADAnalysisFormProps {
  userId: string;
  userOrders: OrdersSchema[];
}

export function CADAnalysisForm({ userId, userOrders }: CADAnalysisFormProps) {
  // Quick Analysis state
  const [quickFile, setQuickFile] = useState<File | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);
  const { splitAssembly: quickSplitAssembly, error: quickApiError, isLoading: quickLoading } = useSplitAssembly();
  const { analyze: analyzeQuick, data: quickAnalysisData, error: quickAnalysisError, isLoading: quickAnalysisLoading } = useAnalyzeCAD();

  // View Order CAD state
  const [selectedOrderId, setSelectedOrderId] = useState<string>(userOrders[0]?.id || '');
  const [orderError, setOrderError] = useState<string | null>(null);
  const { splitAssembly: orderSplitAssembly, data: orderData, error: orderApiError, isLoading: orderLoading } = useSplitAssembly();
  const { analyze: analyzeOrder, data: orderAnalysisData, error: orderAnalysisError, isLoading: orderAnalysisLoading } = useAnalyzeCAD();

  // Get selected order
  const selectedOrder = userOrders.find((o) => o.id === selectedOrderId);
  const orderCADFiles = selectedOrder?.fileURLs ? selectedOrder.fileURLs.split(',').filter(Boolean) : [];

  // Trigger LLM analysis when order split data is available
  useEffect(() => {
    if (orderData && !orderAnalysisData) {
      analyzeOrder(orderData).catch((err) => {
        console.error('Failed to analyze CAD with LLM:', err);
      });
    }
  }, [orderData, orderAnalysisData, analyzeOrder]);

  // Quick Analysis handlers
  const handleQuickFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setQuickFile(event.target.files?.[0] ?? null);
      setQuickError(null);
    },
    []
  );
  const handleQuickSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!quickFile) {
        setQuickError('Please select a CAD file to analyze.');
        return;
      }

      setQuickError(null);

      try {
        // Generate a proper UUID for the quick analysis order
        // The backend will recognize it as a quick order based on the database record
        const splitData = await quickSplitAssembly({
          userId,
          orderId: uuidv4(),
          file: quickFile,
        });
        const analysis = await analyzeQuick(splitData);
        await submitToRequestQueue(analysis, {
          fileName: quickFile.name,
          fileUrl: splitData.originalPath,
        });
        setQuickFile(null);
      } catch {
        // Error is handled by the hook
      }
    },
    [analyzeQuick, quickFile, userId, quickSplitAssembly]
  );

  // View Order CAD handler
  const handleAnalyzeOrderCAD = useCallback(
    async (filePath: string) => {
      if (!selectedOrderId) {
        setOrderError('Please select an order.');
        return;
      }

      setOrderError(null);

      try {
        // For now, we'll use the file path as reference
        // In a real scenario, you might fetch the file from storage first
        // This is a placeholder - the actual implementation depends on how CAD files are stored
        console.log('Analyzing CAD file from order:', filePath);
        // TODO: Fetch file from storage and call splitAssembly
      } catch {
        setOrderError('Failed to analyze CAD file.');
      }
    },
    [selectedOrderId]
  );

  return (
    <Tabs defaultValue="quick" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="quick">Quick Analysis</TabsTrigger>
        <TabsTrigger value="order">Order CAD Files</TabsTrigger>
      </TabsList>

      {/* Quick Analysis Tab */}
      <TabsContent value="quick" className="space-y-6">
        <div>
          <h3 className="h3 mb-2">Analyze CAD File</h3>
          <p className="text-muted-foreground mb-4">
            Upload a CAD file to get instant specifications and analysis. No order context needed.
          </p>
        </div>

        <form onSubmit={handleQuickSubmit} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <label htmlFor="quickCadFile" className="text-sm font-medium">
              CAD File (STEP/IGES)
            </label>
            <input
              id="quickCadFile"
              name="quickCadFile"
              type="file"
              accept=".step,.stp,.iges,.igs"
              onChange={handleQuickFileChange}
              className="text-sm cursor-pointer"
              required
            />
            {quickFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {quickFile.name}
              </p>
            )}
          </fieldset>

          <Button
            type="submit"
            className="bg-brand hover:bg-brand-100 text-white w-full"
            disabled={quickLoading}
          >
            {quickLoading ? 'Analyzing...' : 'Analyze Assembly'}
          </Button>

          {(quickError || quickApiError) && (
            <p className="text-sm text-red-600">
              {quickError ?? quickApiError?.message ?? 'An error occurred.'}
            </p>
          )}

          {quickAnalysisLoading && (
            <p className="text-sm text-muted-foreground">
              Generating specifications from split analysis...
            </p>
          )}

          {quickAnalysisError && (
            <p className="text-sm text-red-600">
              Analysis failed: {quickAnalysisError.message}
            </p>
          )}

          {quickAnalysisData && (
            <CADAnalysisResults result={quickAnalysisData} showQueueAction={false} />
          )}
        </form>
      </TabsContent>

      {/* View Order CAD Tab */}
      <TabsContent value="order" className="space-y-6">
        <div>
          <h3 className="h3 mb-2">View Order CAD Files</h3>
          <p className="text-muted-foreground mb-4">
            Select an order to view and analyze the CAD files attached to it.
          </p>
        </div>

        {userOrders.length === 0 ? (
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              You have no orders in progress. Create an order first to view CAD files.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <label htmlFor="orderSelect" className="text-sm font-medium">
                Select Order
              </label>
              <select
                id="orderSelect"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {userOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.title} ({order.id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </fieldset>

            {orderCADFiles.length === 0 ? (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  No CAD files attached to this order yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">CAD Files in this order:</p>
                <div className="space-y-2">
                  {orderCADFiles.map((filePath, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-md bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{filePath}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAnalyzeOrderCAD(filePath)}
                        disabled={orderLoading}
                        className="ml-2 whitespace-nowrap"
                      >
                        {orderLoading ? 'Analyzing...' : 'Analyze'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {orderError && (
              <p className="text-sm text-red-600">{orderError}</p>
            )}

            {orderApiError && (
              <p className="text-sm text-red-600">{orderApiError.message}</p>
            )}

            {orderAnalysisLoading && (
              <p className="text-sm text-muted-foreground">
                Generating specifications from split analysis...
              </p>
            )}

            {orderAnalysisError && (
              <p className="text-sm text-red-600">
                Analysis failed: {orderAnalysisError.message}
              </p>
            )}

            {orderAnalysisData && (
              <CADAnalysisResults result={orderAnalysisData} />
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
