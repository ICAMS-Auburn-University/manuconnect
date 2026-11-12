'use client';

import { useState } from 'react';
import { ArchiveIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { updateOrder } from '@/domain/orders/service';
import { OrdersSchema } from '@/types/schemas';
import { abbreviateUUID } from '@/lib/utils/transforms';
import { toast } from 'sonner';

interface ArchiveButtonProps {
  order: OrdersSchema;
  onArchive: (orderId: string) => void;
}

const ArchiveButton: React.FC<ArchiveButtonProps> = ({ order, onArchive }) => {
  const [open, setOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
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
      setOpen(false);
      onArchive(order.id);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              aria-label="Archive order"
            >
              <ArchiveIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="font-medium">
            Archive. This cannot be undone.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive order #{abbreviateUUID(order.id)}?</DialogTitle>
            <DialogDescription>
              &ldquo;{order.title}&rdquo; will be hidden from your active lists.
              Archiving cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleArchive()}
              disabled={isArchiving}
            >
              {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Archive order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ArchiveButton;
