'use client';
import { useState, useEffect } from 'react';
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
import { OrdersSchema } from '@/types/schemas';
import { getTagLabel } from '@/types/tags';
import { abbreviateUUID } from '@/lib/utils/transforms';
import type { BrowseOrderData } from '@/domain/orders/browse';
import {
  CalendarIcon,
  CheckCircle2,
  ClipboardList,
  Flame,
  MessageSquare,
  Package2Icon,
  PlusCircle,
  TagIcon,
  UserIcon,
  Wrench,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import OrderPartsPreview from '@/components/orders/OrderPartsPreview';

import { startDirectChat } from '@/lib/api/chats';

const OrderDetails = ({
  order,
  browseEntry,
  onOfferCreated,
}: {
  order: OrdersSchema | null;
  browseEntry?: BrowseOrderData | null;
  onOfferCreated?: () => void;
}) => {
  const router = useRouter();
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);

  // Reset selection when switching orders
  useEffect(() => {
    setSelectedPartIds([]);
  }, [order?.id]);

  if (!order) {
    return (
      <Card className="w-full border-border/70 bg-card/95 shadow-sm xl:min-h-[36rem]">
        <CardContent className="flex min-h-[24rem] items-center justify-center p-8 text-center text-muted-foreground">
          Select an order to review the scope, inspect parts, and prepare an offer.
        </CardContent>
      </Card>
    );
  }

  const handleContactCreator = async () => {
    if (!order.creator) {
      toast.error('Creator information unavailable.');
      return;
    }
    setIsStartingChat(true);
    try {
      const chat = await startDirectChat({
        targetUserId: order.creator,
        orderId: order.id,
      });
      toast.success('Chat ready!');
      router.push(`/messages?chat=${chat.chat_id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start chat';
      toast.error(message);
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <Card className="my-6 w-full border-border/70 bg-card/95 shadow-sm xl:min-h-[36rem]">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Opportunity Review
            </p>
            <CardTitle className="text-2xl font-bold">Order Details</CardTitle>
          </div>
          <Badge variant="outline" className="text-sm font-medium">
            {order.status}
          </Badge>
        </div>

        {browseEntry && (
          <div className="flex flex-wrap items-center gap-2">
            {browseEntry.tagMatchesProfile && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                <Wrench className="h-3 w-3 mr-1" />
                Matches your shop
              </Badge>
            )}
            {browseEntry.userHasOffered ? (
              <Badge className="bg-orange-50 text-[#e87722] border-orange-200 hover:bg-orange-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Offer submitted
              </Badge>
            ) : (
              <Badge variant="outline">Ready to bid</Badge>
            )}
            {browseEntry.offerCount > 0 && (
              <Badge
                className={
                  browseEntry.offerCount <= 3
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50'
                }
              >
                <Flame className="h-3 w-3 mr-1" />
                {browseEntry.offerCount} competing offer
                {browseEntry.offerCount === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
        )}

        <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ClipboardList className="h-4 w-4" />
                <span>Order #{abbreviateUUID(order.id)}</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                {order.title}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Qty {order.quantity}</Badge>
              <Badge variant="outline">
                Due {new Date(order.due_date).toLocaleDateString()}
              </Badge>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {order.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TagIcon className="h-4 w-4" />
              <span className="text-sm">Tags</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {order.tags?.map((tagId) => (
                <Badge key={tagId} className="">
                  {getTagLabel(tagId)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-foreground">Parts Breakdown</h4>
                <p className="text-sm text-muted-foreground">
                  Review assemblies and preselect the exact parts your offer should cover.
                </p>
              </div>
              {selectedPartIds.length > 0 && (
                <Badge variant="secondary">
                  {selectedPartIds.length} part{selectedPartIds.length === 1 ? '' : 's'} selected
                </Badge>
              )}
            </div>

            <OrderPartsPreview
              orderId={order.id}
              selectedPartIds={selectedPartIds}
              onSelectionChange={setSelectedPartIds}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="w-full bg-brand text-white hover:bg-brand-100"
                  size="default"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    <span className="h1">Create Offer</span>
                  </DialogTitle>
                  <span className="text-muted-foreground font-medium text-sm">
                    Order #{abbreviateUUID(order.id)}
                  </span>
                </DialogHeader>
                <DialogDescription className="text-muted-foreground">
                  Fill out the form below to create an offer for this order.
                </DialogDescription>
                <OfferForm
                  order={order}
                  selectedPartIds={selectedPartIds}
                  onOfferCreated={onOfferCreated}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="default"
              disabled={!order.creator || isStartingChat}
              onClick={() => void handleContactCreator()}
            >
              {isStartingChat ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              Contact
            </Button>
            {/* This will eventually be replaced with a realtime chat feature. */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderDetails;
