'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Check,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OffersSchema, OrdersSchema } from '@/types/schemas';
import { acceptOffer, declineOffer, getOffers } from '@/domain/offers/service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { abbreviateUUID } from '@/lib/utils/transforms';

import { startDirectChat } from '@/lib/api/chats';

interface ViewOffersProps {
  order: OrdersSchema;
}

export default function ViewOffers({ order }: ViewOffersProps) {
  const [offers, setOffers] = useState<OffersSchema[]>([]);
  type SortableField = 'manufacturer_name' | 'unit_cost' | 'shipping_cost';

  const [sortField, setSortField] = useState<SortableField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [contactingUserId, setContactingUserId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function fetchOffers() {
      setIsLoading(true);
      try {
        const fetchedOffers = await getOffers(order.id);
        setOffers(fetchedOffers);
      } catch (error) {
        toast.error('Error fetching offers');
        console.error('Error fetching offers:', error);
      }
      setIsLoading(false);
    }

    fetchOffers();
  }, [order.id]);

  if (!isLoading && offers.length === 0) {
    return null;
  }

  // Calculate total cost
  const calculateTotalCost = (
    unitCost: number,
    quantity: number,
    shippingCost: number
  ) => {
    return unitCost * quantity + shippingCost;
  };

  // Handle sorting
  const handleSort = (field: SortableField) => {
    const isSameField = sortField === field;
    const nextDirection =
      isSameField && sortDirection === 'asc' ? 'desc' : 'asc';

    setSortField(field);
    setSortDirection(nextDirection);

    const sortedOffers = [...offers].sort((a, b) => {
      const valueA = a[field];
      const valueB = b[field];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return nextDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      const numericA = Number(valueA ?? 0);
      const numericB = Number(valueB ?? 0);

      return nextDirection === 'asc'
        ? numericA - numericB
        : numericB - numericA;
    });

    setOffers(sortedOffers);
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term === '') {
      setOffers(offers);
      return;
    }

    const filteredOffers = offers.filter((offer) =>
      offer.manufacturer_name.toLowerCase().includes(term.toLowerCase())
    );
    setOffers(filteredOffers);
  };

  // Handle accept
  const handleAccept = (offerId: string) => {
    // In a real app, this would send the acceptance to an API
    try {
      acceptOffer(offerId);
      toast.success('Offers accepted!');
      setOffers(offers.filter((offer) => offer.id !== offerId));
      router.push('/orders'); // Redirect to orders page after accepting
    } catch (error) {
      toast.error('Error accepting offer');
      console.error('Error accepting offer:', error);
    }
  };

  // Handle decline
  const handleDecline = (offerId: string) => {
    // In a real app, this would send the decline to an API
    try {
      declineOffer(offerId);
      const updatedOffers = offers.filter((offer) => offer.id !== offerId);
      setOffers(updatedOffers);
      toast.success('OffersSchema declined!');
    } catch (error) {
      toast.error('Error declining offer');
      console.error('Error declining offer:', error);
    }
  };

  const handleStartChat = async (offer: OffersSchema) => {
    if (!offer.offerer) {
      toast.error('Cannot start chat: missing manufacturer id');
      return;
    }
    setContactingUserId(offer.offerer);
    try {
      const chat = await startDirectChat({
        targetUserId: offer.offerer,
        orderId: order.id,
      });
      toast.success('Chat ready!');
      router.push(`/messages?chat=${chat.chat_id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start chat';
      toast.error(message);
    } finally {
      setContactingUserId(null);
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: SortableField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-auburnBlue relative" size={'sm'}>
            View Offers
            <span className="bg-red absolute inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500  rounded-full -top-2 -end-2">
              {offers.length}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Manufacturing Offers</DialogTitle>
            <DialogDescription>
              Review and respond to offers for order #{abbreviateUUID(order.id)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Search className="h-4 w-4 mr-2 text-muted-foreground" />
              <Input
                placeholder="Search manufacturers..."
                className="w-[250px]"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <Badge variant="outline" className="ml-auto">
              {offers.length} offers available
            </Badge>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('manufacturer_name')}
                  >
                    <div className="flex items-center">
                      Manufacturer
                      {renderSortIndicator('manufacturer_name')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort('unit_cost')}
                  >
                    <div className="flex items-center justify-end">
                      Unit Cost
                      {renderSortIndicator('unit_cost')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort('shipping_cost')}
                  >
                    <div className="flex items-center justify-end">
                      Shipping
                      {renderSortIndicator('shipping_cost')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Est. Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {offer.manufacturer_name || 'Unknown Manufacturer'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Delivery: {offer.lead_time} months
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${parseFloat(offer.unit_cost).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {offer.projected_units.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${parseFloat(offer.shipping_cost).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      $
                      {calculateTotalCost(
                        parseFloat(offer.unit_cost),
                        parseInt(offer.projected_units),
                        parseFloat(offer.shipping_cost)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            offer.id !== undefined && handleDecline(offer.id)
                          }
                          title="Decline"
                        >
                          <X className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Decline</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            offer.id !== undefined && handleAccept(offer.id)
                          }
                          title="Accept"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="sr-only">Accept</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Contact"
                          disabled={contactingUserId === offer.offerer}
                          onClick={() => void handleStartChat(offer)}
                        >
                          {contactingUserId === offer.offerer ? (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="sr-only">Contact</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {offers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No offers match your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
