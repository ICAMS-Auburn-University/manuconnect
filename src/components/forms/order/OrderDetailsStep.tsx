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
import { Textarea } from '@/components/ui/textarea';
import { useFormContext } from 'react-hook-form';

import { OrderDueDatePicker } from './OrderDueDatePicker';
import { OrderFormValues } from './schema';

export function OrderDetailsStep() {
  const form = useFormContext<OrderFormValues>();

  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">
              Project Title
            </FormLabel>
            <FormDescription>
              Give the work order a clear, searchable name.
            </FormDescription>
            <FormControl>
              <Input placeholder="High precision bracket run" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">
              Project Description
            </FormLabel>
            <FormDescription>
              Include key tolerances, finish expectations, and any notes the
              manufacturer should know.
            </FormDescription>
            <FormControl>
              <Textarea
                className="min-h-[140px]"
                placeholder="Walk through the goal, material expectations, and any sequencing considerations."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Projected Units
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 250"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Final Deadline
              </FormLabel>
              <FormDescription>
                We will reference this throughout the manufacturing timeline.
              </FormDescription>
              <FormControl>
                <OrderDueDatePicker
                  value={field.value}
                  onChange={field.onChange}
                  minDate={new Date()}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

    </div>
  );
}
