'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStoredRequests, type ManufacturingRequest } from '@/services/LLM/requestQueue';
import { Package, Clock, DollarSign, CheckCircle, XCircle, Timer } from 'lucide-react';

export default function RequestsPage() {
  const [requests, setRequests] = useState<ManufacturingRequest[]>([]);
  const [filter, setFilter] = useState<'all' | ManufacturingRequest['status']>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    const storedRequests = getStoredRequests();
    setRequests(storedRequests.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const getStatusIcon = (status: ManufacturingRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Timer className="h-4 w-4" />;
      case 'quoted':
        return <DollarSign className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ManufacturingRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'quoted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manufacturing Requests</h1>
        <p className="text-muted-foreground mt-2">
          View and manage CAD analysis requests from customers
        </p>
      </div>

      {/* Filter Tabs */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'quoted', 'accepted', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status}
              {status !== 'all' && (
                <Badge variant="secondary" className="ml-2">
                  {requests.filter(r => r.status === status).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No requests found</h3>
            <p className="text-sm text-muted-foreground">
              {filter === 'all' 
                ? 'No manufacturing requests have been submitted yet.' 
                : `No ${filter} requests found.`}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section - Request Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {request.fileName || `Request ${request.id.slice(-8)}`}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(request.status)}
                        >
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted {new Date(request.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Analysis Summary */}
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-2">
                      {request.analysis.summary}
                    </p>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                      <DollarSign className="h-4 w-4 text-brand" />
                      <div>
                        <p className="text-xs text-muted-foreground">Est. Cost</p>
                        <p className="font-semibold">${parseFloat(request.analysis.estimatedCost).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                      <Package className="h-4 w-4 text-brand" />
                      <div>
                        <p className="text-xs text-muted-foreground">Complexity</p>
                        <p className="font-semibold capitalize">{request.analysis.manufacturingComplexity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                      <Clock className="h-4 w-4 text-brand" />
                      <div>
                        <p className="text-xs text-muted-foreground">Lead Time</p>
                        <p className="font-semibold">{request.analysis.estimatedLeadTime}</p>
                      </div>
                    </div>
                  </div>

                  {/* Materials */}
                  {request.analysis.materials && request.analysis.materials.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Materials</p>
                      <div className="flex flex-wrap gap-1">
                        {request.analysis.materials.map((material, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {material}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Section - Actions */}
                <div className="flex flex-col gap-2 lg:w-48">
                  <Button size="sm" className="w-full">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Download Analysis
                  </Button>
                  {request.status === 'pending' && (
                    <Button variant="default" size="sm" className="w-full bg-brand hover:bg-brand/90">
                      Submit Quote
                    </Button>
                  )}
                </div>
              </div>

              {/* Quotes Section */}
              {request.quotes && request.quotes.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-sm mb-3">Quotes Received</h4>
                  <div className="space-y-2">
                    {request.quotes.map((quote, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div>
                          <p className="font-medium text-sm">{quote.manufacturerName}</p>
                          <p className="text-xs text-muted-foreground">{quote.leadTime} • {new Date(quote.timestamp).toLocaleDateString()}</p>
                          {quote.notes && <p className="text-xs text-muted-foreground mt-1">{quote.notes}</p>}
                        </div>
                        <p className="font-bold text-lg">${quote.quotedPrice.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
