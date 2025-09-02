"use client";
import { Order } from "@/lib/definitions";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getUserId } from "@/utils/supabase/utils";
import { updateOrder } from "@/utils/supabase/orders";
import { createOffer } from "@/utils/supabase/offers";
import { toast } from "sonner";
import { Separator } from "./ui/separator";
import Image from "next/image";
import { DialogClose, DialogFooter } from "./ui/dialog";

const OfferSchema = z.object({
  id: z.number().min(1, { message: "Please enter a valid ID" }),
  unit_cost: z
    .string()
    .min(1, { message: "Please enter a valid cost" })
    .transform((v) => Number(v) || 0),
  projected_cost: z.number().min(1, { message: "Please enter a valid cost" }),
  projected_units: z
    .string()
    .min(1, { message: "Please enter a valid number" })
    .transform((v) => Number(v) || 0),
  shipping_cost: z
    .string()
    .min(1, { message: "Please enter a valid cost" })
    .transform((v) => Number(v) || 0),
  lead_time: z
    .string()
    .min(1, { message: "Please enter a valid number" })
    .transform((v) => Number(v) || 0),
});

interface OfferFormProps {
  order: Order;
}

const OfferForm: React.FC<OfferFormProps> = ({ order }) => {
  const [loading, setLoading] = useState(false);
  // 1. Define your form.
  const form = useForm<z.infer<typeof OfferSchema>>({
    resolver: zodResolver(OfferSchema),
    defaultValues: {
      id: order.id,
      unit_cost: 0,
      projected_cost: 0,
      projected_units: order.quantity,
      shipping_cost: 0,
      lead_time: 0,
    },
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (
        name === "unit_cost" ||
        name === "projected_units" ||
        name === "shipping_cost"
      ) {
        const unitCost = value.unit_cost || 0;
        const projectedUnits = value.projected_units || 0;
        const shippingCost = value.shipping_cost || 0;
        const projected_cost = unitCost * projectedUnits + shippingCost * 1; // TS shits itself if you don't multiply the additive number by 1 ???
        form.setValue("projected_cost", projected_cost);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof OfferSchema>) {
    setLoading(true);
    const Manufacturer = await getUserId();
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    try {
      console.log(values);
      const data = await createOffer({
        offerer: Manufacturer.id,
        order_id: order.id,
        unit_cost: values.unit_cost,
        projected_cost: values.projected_cost,
        projected_units: values.projected_units,
        shipping_cost: values.shipping_cost,
        lead_time: values.lead_time,
        manufacturer_email: Manufacturer.email || "",
        manufacturer_name: Manufacturer.user_metadata.company_name,
      });

      form.reset();

      toast.success(
        "Offer created successfully. The creator will be notified."
      );
    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to create offer. Please try again or contact support."
      );
    }
    setLoading(false);
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="unit_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Cost</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-muted-foreground">$</span>
                      </div>
                      <Input
                        {...field}
                        id="currency"
                        type="number"
                        min={0.001}
                        max={10000}
                        step={0.001}
                        placeholder="0.000"
                        className="pl-9"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the estimated cost of manufacturing a single unit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projected_units"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projected Units</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id="projected_units"
                      type="number"
                      min={1}
                      max={10000}
                      placeholder="0"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the number of units you can manufacture.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="shipping_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Shipping Cost</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-muted-foreground">$</span>
                    </div>
                    <Input
                      {...field}
                      id="currency"
                      type="number"
                      min={0.001}
                      max={10000}
                      step={0.001}
                      placeholder="0.000"
                      className="pl-9"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Enter the estimated cost of shipping.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lead_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Lead Time</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      id="currency"
                      type="number"
                      min={0}
                      max={10000}
                      placeholder="0"
                      className="pr-20"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-muted-foreground">Months</span>
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Enter the estimated lead time from order to delivery.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <FormField
            control={form.control}
            name="projected_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projected Final Cost</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-muted-foreground">$</span>
                    </div>
                    <Input
                      {...field}
                      disabled
                      id="projected_cost"
                      type="number"
                      min={0.001}
                      max={10000}
                      step={0.001}
                      className="pl-9"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  The total cost of manufacturing all projected units.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="sm:justify-start">
            <div className="flex flex-wrap gap-2 w-full">
              <Button
                type="submit"
                className="bg-brand hover:bg-brand-100 transition w-1/3"
              >
                Submit
                {loading && (
                  <Image
                    src="/loader.svg"
                    alt="loader"
                    width={24}
                    height={24}
                    className="ml-2 animate-spin"
                  />
                )}
              </Button>
              <DialogClose asChild>
                <Button variant="outline" className="">
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

export default OfferForm;
