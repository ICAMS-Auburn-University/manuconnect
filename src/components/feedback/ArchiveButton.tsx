'use client';

import { ArchiveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateOrder } from '@/domain/orders/service';
import { OrdersSchema } from '@/types/schemas';
import { toast } from 'sonner';

interface ArchiveButtonProps {
  order: OrdersSchema;
  onArchive: (orderId: string) => void;
}

const ArchiveButton: React.FC<ArchiveButtonProps> = ({ order, onArchive }) => {
  const handleArchive = async () => {
    // Handles the archive button click
    const response = await updateOrder({
      id: order.id,
      isArchived: true,
    });

    if (response?.error) {
      console.error('Failed to archive order:', response.error);
      toast.error('Error archiving order');
      return;
    }

    toast.success('Order archived successfully');
    onArchive(order.id);
  };

  return (
    <>
      <Button variant="outline" size="sm" className="" onClick={handleArchive}>
        <ArchiveIcon className="h-4 w-4" />
      </Button>
    </>
  );
};

export default ArchiveButton;
