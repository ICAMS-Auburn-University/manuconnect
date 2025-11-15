'use client';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFormContext } from 'react-hook-form';

import { OrderFormValues } from './schema';

interface ShippingStepProps {
  isSaving?: boolean;
}

export function ShippingStep({ isSaving = false }: ShippingStepProps) {
  const form = useFormContext<OrderFormValues>();

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="shippingRecipient"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Recipient Name
              </FormLabel>
              <FormControl>
                <Input placeholder="Alex Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shippingCompany"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Company (optional)
              </FormLabel>
              <FormControl>
                <Input placeholder="Acme Manufacturing" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="shippingAddress1"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Address Line 1
              </FormLabel>
              <FormControl>
                <Input placeholder="123 Main St." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shippingAddress2"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Address Line 2
              </FormLabel>
              <FormControl>
                <Input placeholder="Suite or building" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="shippingCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">City</FormLabel>
              <FormControl>
                <Input placeholder="Auburn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shippingState"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">State</FormLabel>
              <FormControl>
                <Input placeholder="AL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shippingZip"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Zip Code
              </FormLabel>
              <FormControl>
                <Input placeholder="36830" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="shippingCountry"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">Country</FormLabel>
            <FormDescription>
              International shipping coming soon. For now we only support US
              addresses.
            </FormDescription>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States of America</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="shippingPhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">
              Phone Number
            </FormLabel>
            <FormControl>
              <Input placeholder="+1 555 0100" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {isSaving && (
        <p className="text-sm text-muted-foreground">
          Saving shipping details…
        </p>
      )}
    </div>
  );
}
