"use client";

import { ArchiveIcon } from "lucide-react";
import { Button } from "./ui/button";
import { updateOrder } from "@/utils/supabase/orders";
import { Order } from "@/lib/definitions";
import { toast } from "sonner";

interface ArchiveButtonProps {
  order: Order;
  onArchive: (orderId: number) => void;
}

const ArchiveButton: React.FC<ArchiveButtonProps> = ({ order, onArchive }) => {
  const handleArchive = async () => {
    // Handles the archive button click
    const response = await updateOrder({
      id: order.id,
      isArchived: true,
    });

    if (response?.error) {
      console.error("Failed to archive order:", response.error);
      toast.error("Error archiving order");
    } else {
      toast.success("Order archived successfully");
      console.log("Order archived successfully:", response?.data);
      onArchive(order.id);
    }
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
