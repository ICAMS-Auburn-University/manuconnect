import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Check,
  X,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  HandCoins,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Offer, Order } from '@/lib/definitions';
import { acceptOffer, declineOffer, getOffers } from '@/utils/supabase/offers';
import Link from 'next/link';
import { toast } from 'sonner';
import { updateOrder } from '@/utils/supabase/orders';
import { redirect } from 'next/navigation';

interface ViewOffersProps {
  order: Order;
}

export default function ViewOffers({ order }: ViewOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [counterofferDialogOpen, setCounterofferDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [counterofferAmount, setCounterofferAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOffers() {
      setLoading(true);
      try {
        const fetchedOffers = await getOffers(order.id);
        setOffers(fetchedOffers);
      } catch (error) {
        toast.error('Error fetching offers');
        console.error('Error fetching offers:', error);
      }
      setLoading(false);
    }

    fetchOffers();
  }, [order.id]);

  if (offers.length === 0) {
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
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }

    const sortedOffers = [...offers].sort((a, b) => {
      // @ts-ignore - Dynamic field access
      const valueA = a[field];
      // @ts-ignore - Dynamic field access
      const valueB = b[field];

      if (typeof valueA === 'string') {
        if (sortDirection === 'asc') {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      } else {
        if (sortDirection === 'asc') {
          return valueA - valueB;
        } else {
          return valueB - valueA;
        }
      }
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

  // Handle counteroffer
  const handleCounteroffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setCounterofferAmount((offer.unit_cost * 0.9).toFixed(2)); // Default to 10% less
    setCounterofferDialogOpen(true);
  };

  // Handle accept
  const handleAccept = (offerId: number) => {
    // In a real app, this would send the acceptance to an API
    try {
      acceptOffer(offerId);
      toast.success('Offer accepted!');
      setOffers(offers.filter((offer) => offer.id !== offerId));
      redirect('/orders'); // Redirect to orders page after accepting
    } catch (error) {
      toast.error('Error accepting offer');
      console.error('Error accepting offer:', error);
    }
  };

  // Handle decline
  const handleDecline = (offerId: number) => {
    // In a real app, this would send the decline to an API
    try {
      declineOffer(offerId);
      const updatedOffers = offers.filter((offer) => offer.id !== offerId);
      setOffers(updatedOffers);
      toast.success('Offer declined!');
    } catch (error) {
      toast.error('Error declining offer');
      console.error('Error declining offer:', error);
    }
  };

  // Handle contact
  const handleContact = (manufacturerName: string) => {
    // In a real app, this would open a contact form or messaging interface
    alert(`Opening chat with ${manufacturerName}`);
  };

  const handleFilterByPrice = (minPrice: number, maxPrice: number) => {
    const filteredOffers = offers.filter(
      (offer) => offer.unit_cost >= minPrice && offer.unit_cost <= maxPrice
    );
    setOffers(filteredOffers);
  };

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
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
              Review and respond to offers for order #
              {order.id.toLocaleString('en-US', {
                minimumIntegerDigits: 6,
                useGrouping: false,
              })}
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
                    onClick={() => handleSort('manufacturerName')}
                  >
                    <div className="flex items-center">
                      Manufacturer
                      {renderSortIndicator('manufacturerName')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort('unitCost')}
                  >
                    <div className="flex items-center justify-end">
                      Unit Cost
                      {renderSortIndicator('unitCost')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort('shippingCost')}
                  >
                    <div className="flex items-center justify-end">
                      Shipping
                      {renderSortIndicator('shippingCost')}
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
                      ${offer.unit_cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {offer.projected_units.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${offer.shipping_cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      $
                      {calculateTotalCost(
                        offer.unit_cost,
                        offer.projected_units,
                        offer.shipping_cost
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
                        {/* <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCounteroffer(offer)}
                          title="Counteroffer"
                        >
                          <RefreshCw className="h-4 w-4 text-amber-500" />
                          <span className="sr-only">Counteroffer</span>
                        </Button> */}
                        <Link href={`mailto:${offer.manufacturer_email}`}>
                          <Button variant="ghost" size="icon" title="Contact">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            <span className="sr-only">Contact</span>
                          </Button>
                        </Link>
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

      {/* Counteroffer Dialog */}
      <Dialog
        open={counterofferDialogOpen}
        onOpenChange={setCounterofferDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Make a Counteroffer</DialogTitle>
            <DialogDescription>
              {selectedOffer && `To ${selectedOffer.manufacturer_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="current-price" className="text-right text-sm">
                Current Price
              </label>
              <div className="col-span-3">
                <Input
                  id="current-price"
                  value={
                    selectedOffer
                      ? `$${selectedOffer.unit_cost.toFixed(2)}`
                      : ''
                  }
                  disabled
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="counteroffer" className="text-right text-sm">
                Your Offer
              </label>
              <div className="col-span-3">
                <Input
                  id="counteroffer"
                  value={counterofferAmount}
                  onChange={(e) => setCounterofferAmount(e.target.value)}
                  placeholder="Enter your counteroffer"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="message" className="text-right text-sm">
                Message
              </label>
              <div className="col-span-3">
                <Input
                  id="message"
                  placeholder="Optional message to manufacturer"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCounterofferDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                alert(
                  `Counteroffer of $${counterofferAmount} sent to ${selectedOffer?.manufacturer_name}!`
                );
                setCounterofferDialogOpen(false);
              }}
            >
              Send Counteroffer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
