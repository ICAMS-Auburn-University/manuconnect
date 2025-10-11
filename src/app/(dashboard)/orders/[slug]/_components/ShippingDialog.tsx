import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  trackingNumber: z
    .string({
      required_error: 'Please enter a tracking number.',
    })
    .min(2, { message: 'Tracking number must be at least 2 characters long' })
    .max(50, { message: 'Tracking number can not exceed 50 characters long' }),
  carrier: z.enum(['UPS', 'FedEx', 'DHL', 'USPS', 'Other'], {
    required_error: 'Please select a carrier.',
  }),
});

interface ShippingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formValues: { trackingNumber: string; carrier: string }) => void;
}

const ShippingDialog = ({
  open,
  onOpenChange,
  onSubmit,
}: ShippingDialogProps) => {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trackingNumber: '',
      carrier: undefined,
    },
  });

  // 2. Define a submit handler.
  function onFormSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle> Shipping Information</DialogTitle>
          <DialogDescription>
            Please enter the carrier and tracking number for the shipment.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrier*</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="">
                        <SelectValue placeholder="Carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPS">UPS</SelectItem>
                        <SelectItem value="FedEx">FedEx</SelectItem>
                        <SelectItem value="DHL">DHL</SelectItem>
                        <SelectItem value="USPS">USPS</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trackingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Number*</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => form.handleSubmit(onFormSubmit)()}
            type="submit"
            className="bg-brand hover:bg-brand-100 transition text-white"
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingDialog;
