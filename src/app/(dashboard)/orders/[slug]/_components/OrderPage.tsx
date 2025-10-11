import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Truck,
  User as LucideUser,
  Mail,
  Phone,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Order, OrderStatus } from '@/lib/types/definitions';
import OrderProgressBar from '@/components/feedback/CustomerOrderProgressBar';
import { updateOrder } from '@/domain/orders/service';
import { getNextOrderStatus } from '@/lib/utils';
import { toast } from 'sonner';
import ViewOffers from './ViewOffers';
import ShippingDialog from './ShippingDialog';
import AddLivestreamForm from '@/components/forms/AddLivestreamForm';
import View3DModel from '@/components/media/ModelViewer';

type OrderPageProps = {
  order: Order;
  userData: SupabaseUser | null;
  manufacturerData: SupabaseUser | null;
  creatorData: SupabaseUser | null;
};

const OrderPage = ({
  order,
  userData,
  manufacturerData,
  creatorData,
}: OrderPageProps) => {
  const [currentStatus, setCurrentStatus] = useState(order.status); // Local state for status
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [isLivestreamDialogOpen, setIsLivestreamDialogOpen] = useState(false);

  const UserType = userData?.user_metadata.account_type;

  const handleUpdateStatus = async () => {
    const nextStatus = getNextOrderStatus(currentStatus);
    if (!nextStatus) {
      toast.info('No next status available');
      return;
    }

    if (nextStatus === OrderStatus.Shipped) {
      setIsShippingDialogOpen(true);
      return;
    }

    try {
      await updateOrder({ id: order.id, status: nextStatus });
      setCurrentStatus(nextStatus);
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
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
      await updateOrder({
        id: order.id,
        status: OrderStatus.Shipped,
        shipping_info: {
          tracking_number: formValues.trackingNumber,
          carrier: formValues.carrier,
        },
      });
      setCurrentStatus(OrderStatus.Shipped);
      setIsShippingDialogOpen(false);
      toast.success('Order status updated to Shipped');
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleLivestreamSubmit = async (formValues: {
    livestreamUrl: string;
  }) => {
    if (!formValues.livestreamUrl) {
      toast.error('Please enter a livestream URL');
      return;
    }

    try {
      await updateOrder({
        id: order.id,
        livestream_url: formValues.livestreamUrl,
      });

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
              Order #
              {order.id.toLocaleString('en-US', {
                minimumIntegerDigits: 6,
                useGrouping: false,
              })}
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
          {order.isArchived && <Badge variant="destructive">Archived</Badge>}
          {!order.manufacturer && <ViewOffers order={order} />}
          {/* <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button> */}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="flex w-full">
          <TabsTrigger value="details" className="flex-1">
            Order Details
          </TabsTrigger>
          <TabsTrigger value="model" className="flex-1">
            3D Model
          </TabsTrigger>
          <TabsTrigger value="livestream" className="flex-1">
            Livestream View
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex-1">
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{order.title}</CardTitle>
              </CardHeader>
              <CardContent>
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
                      <p className="text-sm flex">
                        <Phone className="mr-2 h-4 w-4" />
                        {manufacturerData?.user_metadata.phone_number ||
                          'Not Found'}
                      </p>
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
                      <p className="text-sm flex">
                        <Phone className="mr-2 h-4 w-4" />
                        {creatorData?.user_metadata.phone_number || 'Not Found'}
                      </p>
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

          <Card>
            <CardHeader>
              <CardTitle>Model Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="dimensions">
                  <AccordionTrigger>Dimensions</AccordionTrigger>
                  <AccordionContent>
                    <p>Height: 15cm</p>
                    <p>Width: 10cm</p>
                    <p>Depth: 8cm</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="materials">
                  <AccordionTrigger>Materials</AccordionTrigger>
                  <AccordionContent>
                    <p>PLA Plastic</p>
                    <p>Hand-painted finish</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="colors">
                  <AccordionTrigger>Colors</AccordionTrigger>
                  <AccordionContent>
                    <p>Primary: Red</p>
                    <p>Secondary: Gold</p>
                    <p>Accents: Black</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
          {(order.livestream_url || UserType === 'admin') && (
            <Card>
              <CardHeader>
                <CardTitle>Live Feed</CardTitle>
                <CardDescription>
                  Livestream provided by manufacturer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {order.livestream_url ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${order.livestream_url.substring(
                      order.livestream_url.length - 11
                    )}?autoplay=1`}
                    title="Live Stream"
                    className="w-full h-96"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <p>No live stream available.</p>
                    {UserType === 'admin' && (
                      <Button
                        variant="outline"
                        className="text-muted-foreground"
                        onClick={() => setIsLivestreamDialogOpen(true)}
                      >
                        Add Live Stream
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
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
                  {(UserType === 'manufacturer' || UserType === 'admin') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUpdateStatus}
                    >
                      Update Status
                    </Button>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full">
              {(UserType === 'creator' || UserType === 'admin') && (
                <OrderProgressBar currentStatus={currentStatus} />
              )}
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
