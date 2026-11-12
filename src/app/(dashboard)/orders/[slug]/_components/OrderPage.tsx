import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Truck,
  User as LucideUser,
  Mail,
  // Phone,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { abbreviateUUID } from '@/lib/utils/transforms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrdersSchema } from '@/types/schemas';
import { OrderStatus } from '@/types/enums';
import OrderProgressBar from '@/components/feedback/CustomerOrderProgressBar';
import { updateOrder } from '@/domain/orders/service';
import { getNextOrderStatus } from '@/lib/utils';
import { toast } from 'sonner';
import ViewOffers from './ViewOffers';
import ShippingDialog from './ShippingDialog';
import AddLivestreamForm from '@/components/forms/AddLivestreamForm';
import View3DModel from '@/components/media/ModelViewer';
import { AssemblyCollaborationTab } from './AssemblyCollaborationTab';
import type { UserProfile } from '@/domain/users/types';
import { ChevronRight } from 'lucide-react';
import { CADAnalysisResults } from '@/components/cad/CADAnalysisResults';
import OrderPartsOverview from '@/components/orders/OrderPartsOverview';
import { cn } from '@/lib/utils';
import { TONE } from '@/lib/utils/tones';
import { parseYouTubeId } from '@/lib/utils/youtube';

const ORDER_TABS = [
  'details',
  'model',
  'livestream',
  'timeline',
  'collaboration',
] as const;
type OrderTab = (typeof ORDER_TABS)[number];

// What the lead manufacturer should do before moving to the next status.
const MANUFACTURER_NEXT_STEP_HINT: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.OrderAccepted]:
    'Confirm materials and scheduling with the customer, then move to Machine Setup.',
  [OrderStatus.MachineSetup]:
    'Finish tooling and programming. Advance once production starts.',
  [OrderStatus.StartedManufacturing]:
    'Advance to Quality Check when parts come off the machine. Subcontracted parts must be shipped to you first.',
  [OrderStatus.QualityCheck]:
    'Inspect against the specifications. Advancing to Shipping asks for a carrier and tracking number.',
  [OrderStatus.Shipped]:
    'Mark the order Completed once the customer confirms delivery.',
};

type OrderPageProps = {
  order: OrdersSchema;
  userData: UserProfile | null;
  manufacturerData: UserProfile | null;
  creatorData: UserProfile | null;
};

type CollaborationStatusSnapshot = {
  assignments: Array<{
    id: string;
    status: string;
    partName?: string;
  }>;
};

const OrderPage = ({
  order,
  userData,
  manufacturerData,
  creatorData,
}: OrderPageProps) => {
  const [currentStatus, setCurrentStatus] = useState(
    order.status as OrderStatus
  ); // Local state for status
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [isLivestreamDialogOpen, setIsLivestreamDialogOpen] = useState(false);
  const [waitingOnPartsCount, setWaitingOnPartsCount] = useState(0);
  const [livestreamUrl, setLivestreamUrl] = useState(order.livestream_url);
  // OrderPage only mounts after the client-side load, so reading the URL here is safe.
  const [tab, setTab] = useState<OrderTab>(() => {
    if (typeof window === 'undefined') return 'details';
    const requested = new URLSearchParams(window.location.search).get('tab');
    return (ORDER_TABS as readonly string[]).includes(requested ?? '')
      ? (requested as OrderTab)
      : 'details';
  });
  const UserType = userData?.accountType;

  useEffect(() => {
    let mounted = true;

    const fetchPartGate = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/collaboration`);
        if (!res.ok) return;
        const json = (await res.json()) as CollaborationStatusSnapshot;
        if (!mounted) return;
        const assignments = json.assignments ?? [];
        const pending = assignments.filter((a) => a.status !== 'Shipped').length;
        setWaitingOnPartsCount(pending);
      } catch {
        // Keep UI functional even if collaboration snapshot fails.
      }
    };

    void fetchPartGate();
    const timer = setInterval(() => {
      void fetchPartGate();
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [order.id]);

  const nextStatus = getNextOrderStatus(currentStatus);
  const blocksAssemblyStart =
    nextStatus === OrderStatus.StartedManufacturing && waitingOnPartsCount > 0;

  const statusReason = (() => {
    if (!order.manufacturer) {
      return {
        tone: TONE.blue,
        label: 'Waiting on manufacturer selection',
      };
    }

    if (waitingOnPartsCount > 0) {
      return {
        tone: TONE.amber,
        label: `Waiting on ${waitingOnPartsCount} shipped part${
          waitingOnPartsCount === 1 ? '' : 's'
        } before assembly start`,
      };
    }

    if (currentStatus === OrderStatus.Shipped) {
      return {
        tone: TONE.teal,
        label: 'Waiting on delivery confirmation',
      };
    }

    return null;
  })();

  const handleUpdateStatus = async () => {
    const nextStatus = getNextOrderStatus(currentStatus);
    if (!nextStatus) {
      toast.info('No next status available');
      return;
    }

    if (nextStatus === OrderStatus.StartedManufacturing && waitingOnPartsCount > 0) {
      toast.error(
        `Waiting on ${waitingOnPartsCount} subcontracted part${
          waitingOnPartsCount === 1 ? '' : 's'
        } to be marked as Shipped before starting assembly.`
      );
      return;
    }

    if (nextStatus === OrderStatus.Shipped) {
      setIsShippingDialogOpen(true);
      return;
    }

    try {
      const result = await updateOrder({ id: order.id, status: nextStatus });
      if (result.error) {
        throw new Error(String(result.error));
      }
      setCurrentStatus(nextStatus);
      toast.success('Order status updated');
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update order status'
      );
    }
  };

  const handleShippingSubmit = async (formValues: {
    trackingNumber: string;
    carrier: string;
  }) => {
    if (!formValues.trackingNumber || !formValues.carrier) {
      toast.error('Please fill in all shipping details');
      return;
    }

    try {
      const result = await updateOrder({
        id: order.id,
        status: OrderStatus.Shipped,
        shipping_info: {
          tracking_number: formValues.trackingNumber,
          carrier: formValues.carrier,
        },
      });
      if (result.error) {
        throw new Error(String(result.error));
      }
      setCurrentStatus(OrderStatus.Shipped);
      setIsShippingDialogOpen(false);
      toast.success('Order marked as shipped');
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update order status'
      );
    }
  };

  const handleLivestreamSubmit = async (formValues: {
    livestreamUrl: string;
  }) => {
    if (!formValues.livestreamUrl) {
      toast.error('Please enter a livestream URL');
      return;
    }

    if (!parseYouTubeId(formValues.livestreamUrl)) {
      toast.error('Please enter a valid YouTube link');
      return;
    }

    try {
      const result = await updateOrder({
        id: order.id,
        livestream_url: formValues.livestreamUrl,
      });
      if (result?.error) {
        throw new Error(String(result.error));
      }

      setLivestreamUrl(formValues.livestreamUrl);
      setIsLivestreamDialogOpen(false);
      toast.success('Link to livestream added successfully');
    } catch (error) {
      console.error('Failed to add livestream link:', error);
      toast.error('Failed to add livestream link');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to orders</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Order #{abbreviateUUID(order.id)}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {new Date(order.created_at).toLocaleDateString()}{' '}
            </p>
            <p className="text-sm text-muted-foreground">
              Last Updated at{' '}
              {new Date(order.last_update).toLocaleString()}{' '}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={order.status === 'Completed' ? 'default' : 'secondary'}
          >
            {order.status}
          </Badge>
          {statusReason && (
            <Badge variant="outline" className={statusReason.tone}>
              {statusReason.label}
            </Badge>
          )}
          {order.isArchived && <Badge variant="destructive">Archived</Badge>}
          {!order.manufacturer && <ViewOffers order={order} />}
          {/* <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button> */}
        </div>
      </div>

      {/* Manufacturer status advancement banner */}
      {(UserType === 'manufacturer' || UserType === 'admin') &&
        order.manufacturer &&
        currentStatus !== OrderStatus.Completed && (
          <Card className="border-[#e87722] bg-orange-50/50 dark:bg-orange-950/20">
            <CardContent className="space-y-3 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#e87722] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {Object.values(OrderStatus).indexOf(currentStatus) + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <p className="font-semibold">{currentStatus}</p>
                  </div>
                </div>
                {nextStatus && (
                  <Button
                    className="bg-[#e87722] hover:bg-[#d06a1e] text-white"
                    disabled={blocksAssemblyStart}
                    onClick={handleUpdateStatus}
                  >
                    {blocksAssemblyStart
                      ? `Waiting on ${waitingOnPartsCount} shipped part${
                          waitingOnPartsCount === 1 ? '' : 's'
                        }`
                      : `Advance to ${nextStatus}`}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
              {MANUFACTURER_NEXT_STEP_HINT[currentStatus] && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Next step: </span>
                  {MANUFACTURER_NEXT_STEP_HINT[currentStatus]}
                </p>
              )}
            </CardContent>
          </Card>
        )}

      {order.manufacturer && waitingOnPartsCount > 0 && (
        <Card className={cn(TONE.amber)}>
          <CardContent className="py-3">
            <p className="text-sm font-medium">
              Waiting on parts before assembly can begin
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {waitingOnPartsCount} assigned part
              {waitingOnPartsCount === 1 ? '' : 's'} still need to be marked as
              Shipped by their manufacturers.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as OrderTab)}
        className="w-full"
      >
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto sm:justify-between">
          <TabsTrigger value="details" className="flex-1 shrink-0">
            Order Details
          </TabsTrigger>
          <TabsTrigger value="model" className="flex-1 shrink-0">
            3D Model
          </TabsTrigger>
          <TabsTrigger value="livestream" className="flex-1 shrink-0">
            Livestream View
            {livestreamUrl && (
              <span
                className="ml-1.5 h-1.5 w-1.5 rounded-full bg-red-500"
                aria-label="Livestream available"
              />
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex-1 shrink-0">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="flex-1 shrink-0">
            Assembly &amp; Collaboration
            {waitingOnPartsCount > 0 && (
              <Badge className="ml-2 h-5 min-w-5 justify-center px-1.5 text-[10px]">
                {waitingOnPartsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{order.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="font-medium">{order.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due date</p>
                    <p className="font-medium">
                      {new Date(order.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {/* <div className="flex gap-2">
                  {order.tags?.map((tagId) => {
                    // Find tag details from all tag types
                    const allTags = [
                      ...ProcessTags,
                      ...MaterialTags,
                      ...MiscTags,
                    ];
                    const tagDetails = allTags.find((t) => t.id === tagId);

                    return (
                      <Badge key={tagId} className="">
                        {tagDetails?.label || tagId}
                      </Badge>
                    );
                  })}
                </div> */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{order.description}</p>
                  </div>
                  {order.selected_offer && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>
                          $
                          {order.price?.unit_cost
                            ? (
                                order.price.unit_cost *
                                order.price.projected_units
                              ).toFixed(2)
                            : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>
                          ${order.price?.shipping_cost.toFixed(2) || 'Unknown'}
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>${order.price?.projected_cost.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        * Pricing is not final and is provided by manufacturer
                        during the offer process.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {(UserType === 'creator' || UserType === 'admin') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LucideUser className="mr-2 h-4 w-4" />
                      Manufacturer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {order.manufacturer_name || 'Unassigned'}
                      </p>
                      <p className="text-sm flex">
                        <Mail className="mr-2 h-4 w-4" />
                        <Link href={`mailto:${manufacturerData?.email || ''}`}>
                          {manufacturerData?.email || 'Not Found'}
                        </Link>
                      </p>
                      {/* <p className="text-sm flex">
                        <Phone className="mr-2 h-4 w-4" />
                        {manufacturerData?.user_metadata.phone_number ||
                          'Not Found'}
                      </p> */}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(UserType === 'manufacturer' || UserType === 'admin') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LucideUser className="mr-2 h-4 w-4" />
                      Customer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="font-medium">{order.creator_name}</p>
                      <p className="text-sm flex">
                        <Mail className="mr-2 h-4 w-4" />
                        <Link href={`mailto:${creatorData?.email || ''}`}>
                          {creatorData?.email || 'Not Found'}
                        </Link>
                      </p>
                      {/* <p className="text-sm flex">
                        <Phone className="mr-2 h-4 w-4" />
                        {creatorData?.user_metadata.phone_number || 'Not Found'}
                      </p> */}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="mr-2 h-4 w-4" />
                    Shipping Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{order.delivery_address?.street}</p>
                  <p className="text-sm">
                    {order.delivery_address?.city},{' '}
                    {order.delivery_address?.state}{' '}
                    {order.delivery_address?.postal_code}
                  </p>
                  <p className="text-sm">United States of America</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Parts &amp; Specifications</CardTitle>
              <CardDescription>
                Materials and processes the customer specified for each part.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderPartsOverview
                orderId={order.id}
                showMatch={UserType === 'manufacturer'}
              />
            </CardContent>
          </Card>

          {order.cad_analysis && (
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">
                  Manufacturing Analysis
                </h2>
                <p className="text-sm text-muted-foreground">
                  Saved AI analysis for this order&apos;s uploaded CAD model.
                </p>
              </div>
              <CADAnalysisResults
                result={order.cad_analysis}
                showQueueAction={false}
              />
            </section>
          )}
        </TabsContent>

        <TabsContent value="model" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>3D Model Preview</CardTitle>
              <CardDescription>
                View and interact with the 3D model
              </CardDescription>
            </CardHeader>
            <CardContent className="h-full">
              <View3DModel order={order} />
            </CardContent>
          </Card>
        </TabsContent>

        <ShippingDialog
          open={isShippingDialogOpen}
          onOpenChange={setIsShippingDialogOpen}
          onSubmit={handleShippingSubmit}
        />

        <AddLivestreamForm
          open={isLivestreamDialogOpen}
          onOpenChange={setIsLivestreamDialogOpen}
          onSubmit={handleLivestreamSubmit}
        />

        <TabsContent value="livestream" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Live Feed</CardTitle>
                <CardDescription>
                  Livestream provided by manufacturer
                </CardDescription>
              </div>
              {(UserType === 'admin' || UserType === 'manufacturer') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLivestreamDialogOpen(true)}
                >
                  {livestreamUrl ? 'Update URL' : 'Add URL'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {livestreamUrl && parseYouTubeId(livestreamUrl) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${parseYouTubeId(
                    livestreamUrl
                  )}?autoplay=1`}
                  title="Live Stream"
                  className="w-full h-96"
                  allowFullScreen
                />
              ) : livestreamUrl ? (
                <p className="text-sm text-muted-foreground">
                  We couldn&apos;t read this livestream link.{' '}
                  {(UserType === 'admin' || UserType === 'manufacturer') &&
                    'Use "Update URL" to paste a YouTube link.'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No live stream available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <p>Order Status</p>
                <p className="text-base">
                  Due Date: {new Date(order.due_date).toLocaleDateString()}
                </p>
              </CardTitle>
              <CardDescription>
                <div className="flex flex-row justify-between items-center">
                  Track the progress of your order
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full">
              <OrderProgressBar currentStatus={currentStatus} />
            </CardContent>
          </Card>

          {order.shipping_info?.tracking_number && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  <span className="font-bold">Carrier: </span>
                  {order.shipping_info?.carrier}
                </p>
                <p>
                  <span className="font-bold">Tracking Number: </span>
                  {order.shipping_info?.tracking_number}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          <AssemblyCollaborationTab order={order} userData={userData} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Link href="mailto:support@manuconnect.org">
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default OrderPage;
