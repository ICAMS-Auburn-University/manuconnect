'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import OfferForm from '@/components/forms/OfferForm';
import {
  Order,
  ProcessTags,
  MaterialTags,
  MiscTags,
} from '@/lib/types/definitions';
import {
  CalendarIcon,
  ClipboardList,
  MessageSquare,
  Package2Icon,
  PlusCircle,
  TagIcon,
  UserIcon,
} from 'lucide-react';
const OrderDetails = ({ order }: { order: Order | null }) => {
  if (!order) {
    return <div>No order selected.</div>;
  }
  return (
    <Card className="w-full max-w-md mx-auto shadow-sm min-h-[30rem] my-10">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Order Details</CardTitle>
          <Badge variant="outline" className="text-sm font-medium">
            {order.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              <span className="text-sm">
                {' '}
                #
                {order.id.toLocaleString('en-US', {
                  minimumIntegerDigits: 6,
                  useGrouping: false,
                })}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-1">{order.title}</h3>
            <p className="text-muted-foreground text-sm">{order.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span className="text-sm">Creator</span>
              </div>
              <p className="font-medium">{order.creator_name || '-'}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package2Icon className="h-4 w-4" />
                <span className="text-sm">Quantity</span>
              </div>
              <p className="font-medium">{order.quantity}</p>
            </div>

            <div className="space-y-1 col-span-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-sm">Created</span>
              </div>
              <p className="font-medium">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>

            <div className="space-y-1 col-span-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-sm">Due</span>
              </div>
              <p className="font-medium">
                {new Date(order.due_date).toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TagIcon className="h-4 w-4" />
              <span className="text-sm">Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {order.tags?.map((tagId) => {
                // Find tag details from all tag types
                const allTags = [...ProcessTags, ...MaterialTags, ...MiscTags];
                const tagDetails = allTags.find((t) => t.id === tagId);

                return (
                  <Badge key={tagId} className="">
                    {tagDetails?.label || tagId}
                  </Badge>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-3 w-full">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="flex-1 bg-brand hover:bg-brand-100 text-white"
                  size="sm"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>
                    <span className="h1">Create Offer</span>
                  </DialogTitle>
                  <span className="text-muted-foreground font-medium text-sm">
                    Order: #
                    {order.id.toLocaleString('en-US', {
                      minimumIntegerDigits: 6,
                      useGrouping: false,
                    })}
                  </span>
                </DialogHeader>
                <DialogDescription className="text-muted-foreground">
                  Fill out the form below to create an offer for this order.
                </DialogDescription>
                <OfferForm order={order} />
              </DialogContent>
            </Dialog>
            {order.creator && (
              <Link href={'mailto:' + order.creator_email}>
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </Link>
            )}
            {/* This will eventually be replaced with a realtime chat feature. */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderDetails;
