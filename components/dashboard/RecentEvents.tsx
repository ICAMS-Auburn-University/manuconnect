'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  HandCoins,
  Package,
  ShoppingCart,
  User,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { getRecentEvents } from '@/utils/supabase/events';
import { Event } from '@/lib/definitions';
import Link from 'next/link';

// Type definition based on the provided schema
interface RecentEventsProps {
  limit?: number;
  height?: string;
  title?: string;
  description?: string;
}

export function RecentEvents({
  limit = 10,
  height = '400px',
  title = 'Recent Events',
  description = 'Latest activity in your system',
}: RecentEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // In a real application, this would be a fetch call to your API
        const data = await getRecentEvents(limit);
        if (!data) {
          setLoading(false);
          return;
        }
        setEvents(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, [limit]);

  // Function to determine which icon to show based on event type
  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-blue" />;
      case 'user':
        return <User className="h-4 w-4 text-green" />;
      case 'system':
        return <Activity className="h-4 w-4 text-purple-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green" />;
      case 'shipment':
        return <Package className="h-4 w-4 text-orange-500" />;
      case 'offer':
        return <HandCoins className="h-4 w-4 text-yellow-500" />;

      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className={`h-[${height}]`} style={{ height }}>
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-4 mb-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))
          ) : events.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No recent events found
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {events.map((event) => (
                <Link
                  key={event.id}
                  className="flex items-start space-x-4 border p-2 hover:bg-slate-50 transition-colors duration-200 rounded-md"
                  href={`/orders/${event.order_id}`}
                >
                  <div className="mt-1 bg-muted rounded-full p-2">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 ">
                    <p className="text-sm font-medium leading-none">
                      {event.description}
                    </p>
                    <div className="flex items-center pt-1 text-xs text-muted-foreground">
                      Order #
                      {event.order_id.toLocaleString('en-US', {
                        minimumIntegerDigits: 6,
                        useGrouping: false,
                      })}{' '}
                      •{' '}
                      {formatDistanceToNow(new Date(event.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                    {event.metadata &&
                      Object.keys(event.metadata).length > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground bg-muted/50 p-1.5 rounded">
                          <code className="text-xs">
                            {JSON.stringify(event.metadata, null, 2)}
                          </code>
                        </div>
                      )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
