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
      <Card className="p-6 bg-muted/50">
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
      <Card className="p-4 border-red-200 bg-red-50/50">
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
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="p-6 border-brand/50 bg-gradient-to-br from-brand/5 to-transparent">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Analysis Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {result.summary}
            </p>
          </div>
        </div>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manufacturing Complexity */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
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
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
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
        <Card className="p-4">
          <h4 className="font-semibold mb-3 text-sm">Materials Required</h4>
          <div className="space-y-2">
            {result.materials.map((material, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-sm">{material}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Key Specifications */}
      {result.keySpecifications &&
        Object.keys(result.keySpecifications).length > 0 && (
          <Card className="p-4">
            <h4 className="font-semibold mb-3 text-sm">Key Specifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(result.keySpecifications).map(([key, value]) => (
                <div
                  key={key}
                  className="p-2 bg-muted/50 rounded text-sm flex justify-between"
                >
                  <span className="font-medium text-muted-foreground">{key}:</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card className="p-4 border-blue-200 bg-blue-50/50">
          <h4 className="font-semibold mb-3 text-sm">Recommendations</h4>
          <ul className="space-y-2">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-2 text-sm">
                <span className="text-blue-600 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Download Options */}
      <Card className="p-4 bg-gradient-to-br from-muted/50 to-transparent">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-muted-foreground" />
            <div>
              <h4 className="font-semibold text-sm">Export Analysis</h4>
              <p className="text-xs text-muted-foreground">Download report for documentation</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAnalysisAsPDF(result)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAnalysisAsCSV(result)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Send to Manufacturers */}
      {showQueueAction && (
      <Card className="p-4 bg-gradient-to-br from-brand/5 to-transparent border-brand/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-brand" />
            <div>
              <h4 className="font-semibold text-sm">Request Manufacturing Quote</h4>
              <p className="text-xs text-muted-foreground">
                Send this analysis to manufacturers for pricing and availability
              </p>
            </div>
          </div>
          <Button
            variant={submitSuccess ? "default" : "outline"}
            size="sm"
            onClick={handleSendToManufacturers}
            disabled={isSubmitting || submitSuccess}
            className={submitSuccess ? "bg-green-600 hover:bg-green-700" : "border-brand text-brand hover:bg-brand hover:text-white"}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin mr-2">⚙️</div>
                Sending...
              </>
            ) : submitSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Sent to Queue
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
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
