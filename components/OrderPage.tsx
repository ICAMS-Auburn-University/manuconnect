import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Truck,
  User as LucideUser,
  Mail,
  Phone,
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';

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
import { Order, OrderStatus } from '@/lib/definitions';
import { User as SupabaseUser } from '@supabase/supabase-js';
import OrderProgressBar from './CustomerOrderProgressBar';
import { updateOrder } from '@/utils/supabase/orders';
import { getNextOrderStatus } from '@/lib/utils';
import { toast } from 'sonner';
import ViewOffers from './ViewOffers';
import ShippingDialog from './ShippingDialog';
import { getUserById } from '@/utils/adminUtils';
import AddLivestreamForm from './AddLivestreamForm';

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
  const [activeTab, setActiveTab] = useState('details');
  const [currentStatus, setCurrentStatus] = useState(order.status); // Local state for status
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [isLivestreamDialogOpen, setIsLivestreamDialogOpen] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    trackingNumber: '',
    carrier: '',
  });
  const [livestreamUrl, setLivestreamUrl] = useState('');

  const UserType = userData?.user_metadata.account_type;

  const handleUpdateStatus = async () => {
    const nextStatus = getNextOrderStatus(currentStatus);
    if (!nextStatus) {
      console.log('No next status available');
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
    <div className="container mx-auto py-6 space-y-8">
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

      <Tabs
        defaultValue="details"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Order Details</TabsTrigger>
          {/* <TabsTrigger value="model">**WIP** 3D Model</TabsTrigger> */}
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          {/* {order.livestream_url && (
            <TabsTrigger value="livestream">Livestream View</TabsTrigger>
          )} */}
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
            <CardContent>
              <div className="w-full h-[500px] bg-muted rounded-md overflow-hidden">
                <Canvas>
                  <ambientLight intensity={0.5} />
                  <spotLight
                    position={[10, 10, 10]}
                    angle={0.15}
                    penumbra={1}
                  />
                  <pointLight position={[-10, -10, -10]} />
                  <OrbitControls />
                  <Environment preset="studio" />
                  {/* 3D model would be loaded here */}
                  <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#ff6b6b" />
                  </mesh>
                </Canvas>
              </div>
              <div className="mt-4 flex justify-between">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Model
                </Button>
              </div>
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
          shippingInfo={shippingInfo}
          setShippingInfo={setShippingInfo}
          onSubmit={handleShippingSubmit}
        />

        <AddLivestreamForm
          open={isLivestreamDialogOpen}
          onOpenChange={setIsLivestreamDialogOpen}
          livestreamUrl={livestreamUrl}
          setLivestreamUrl={setLivestreamUrl}
          onSubmit={handleLivestreamSubmit}
        />

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
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
                    )}`}
                    title="Live Stream"
                    className="w w-96"
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

          <Card>
            <CardHeader>
              <CardTitle>Due Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-2xl font-bold">
                  {new Date(order.due_date).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Link href="mailto:support@manuconnect.org">
          <Button variant="outline">Contact Support</Button>
        </Link>
        <Button className="bg-brand hover:bg-brand-100">Update Order</Button>
      </div>
    </div>
  );
};

export default OrderPage;
