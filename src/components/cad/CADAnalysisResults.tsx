'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CADAnalysisResult } from '@/services/LLM/types';
import { CheckCircle2, Zap, Clock, AlertCircle, FileDown, FileText, Send } from 'lucide-react';
import { exportAnalysisAsPDF, exportAnalysisAsCSV } from '@/services/LLM/exportAnalysis';
import { useState } from 'react';
import { submitToRequestQueue } from '@/services/LLM/requestQueue';

interface CADAnalysisResultsProps {
  result: CADAnalysisResult;
  isLoading?: boolean;
  error?: Error | null;
  showQueueAction?: boolean;
}

export function CADAnalysisResults({
  result,
  isLoading = false,
  error = null,
  showQueueAction = true,
}: CADAnalysisResultsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSendToManufacturers = async () => {
    setIsSubmitting(true);
    try {
      await submitToRequestQueue(result);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to submit to request queue:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-muted/50 p-6 sm:p-7">
        <div className="flex items-center gap-2">
          <div className="animate-spin">⚙️</div>
          <p className="text-sm text-muted-foreground">
            Analyzing CAD specifications...
          </p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50 p-5 sm:p-6 dark:border-red-900/60 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 text-sm">Analysis Error</p>
            <p className="text-sm text-red-700 mt-1">
              {error.message}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary Card */}
      <Card className="border-brand/40 bg-gradient-to-br from-brand/5 to-transparent p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <h3 className="text-base font-semibold">Analysis Summary</h3>
            <p className="text-sm leading-7 text-muted-foreground">
              {result.summary}
            </p>
          </div>
        </div>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Manufacturing Complexity */}
        <Card className="p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Complexity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getComplexityVariant(result.manufacturingComplexity)}>
              {result.manufacturingComplexity}
            </Badge>
          </div>
        </Card>

        {/* Lead Time */}
        <Card className="p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Lead Time
            </p>
          </div>
          <p className="text-2xl font-bold">{result.estimatedLeadTime}</p>
        </Card>
      </div>

      {/* Materials */}
      {result.materials && result.materials.length > 0 && (
        <Card className="p-5 sm:p-6">
          <h4 className="mb-4 text-sm font-semibold">Materials Required</h4>
          <div className="space-y-3">
            {result.materials.map((material, idx) => (
              <div
                key={idx}
                className="rounded-lg bg-muted/50 px-3 py-3 text-sm leading-6"
              >
                <span>{material}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Key Specifications */}
      {result.keySpecifications &&
        Object.keys(result.keySpecifications).length > 0 && (
          <Card className="p-5 sm:p-6">
            <h4 className="mb-4 text-sm font-semibold">Key Specifications</h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Object.entries(result.keySpecifications).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg bg-muted/50 px-3 py-3 text-sm"
                >
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {key}
                    </p>
                    <p className="font-semibold leading-6 text-foreground">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 p-5 sm:p-6 dark:border-blue-900/60 dark:bg-blue-950/20">
          <h4 className="mb-4 text-sm font-semibold">Recommendations</h4>
          <ul className="space-y-3">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-3 text-sm leading-6">
                <span className="pt-0.5 font-bold text-blue-600">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Download Options */}
      <Card className="bg-gradient-to-br from-muted/50 to-transparent p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-muted-foreground" />
            <div>
              <h4 className="font-semibold text-sm">Export Analysis</h4>
              <p className="text-xs leading-5 text-muted-foreground">
                Download report for documentation
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAnalysisAsPDF(result)}
              className="gap-2 sm:min-w-[140px]"
            >
              <FileText className="h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAnalysisAsCSV(result)}
              className="gap-2 sm:min-w-[140px]"
            >
              <FileText className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Send to Manufacturers */}
      {showQueueAction && (
        <Card className="border-brand/50 bg-gradient-to-br from-brand/5 to-transparent p-5 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Send className="mt-0.5 h-5 w-5 text-brand" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold">
                  Request Manufacturing Quote
                </h4>
                <p className="text-xs leading-5 text-muted-foreground">
                  Send this analysis to manufacturers for pricing and
                  availability.
                </p>
              </div>
            </div>
            <Button
              variant={submitSuccess ? 'default' : 'outline'}
              size="sm"
              onClick={handleSendToManufacturers}
              disabled={isSubmitting || submitSuccess}
              className={
                submitSuccess
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'border-brand text-brand hover:bg-brand hover:text-white'
              }
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 animate-spin">⚙️</div>
                  Sending...
                </>
              ) : submitSuccess ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Sent to Queue
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to Manufacturers
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function getComplexityVariant(
  complexity: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const lower = complexity.toLowerCase();
  if (lower.includes('high')) return 'destructive';
  if (lower.includes('medium')) return 'secondary';
  return 'default';
}
