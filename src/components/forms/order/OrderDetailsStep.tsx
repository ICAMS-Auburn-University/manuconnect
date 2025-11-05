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
import { Checkbox } from '@/components/ui/checkbox';
import { useFormContext } from 'react-hook-form';

import { OrderDueDatePicker } from './OrderDueDatePicker';
import { OrderFormValues } from './schema';
import { materialTagOptions, processTagOptions } from '@/types/tags';

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

      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => {
          const selected = field.value ?? [];

          const toggleTag = (tagId: string, checked: boolean) => {
            const nextTags = checked
              ? [...selected, tagId]
              : selected.filter((value) => value !== tagId);
            field.onChange(nextTags);
          };

          return (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Process &amp; Material Tags
              </FormLabel>
              <FormDescription>
                These help us match the order with the right manufacturing
                partners. CAD-derived tags will auto-populate once uploaded.
              </FormDescription>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Process</p>
                  <div className="space-y-2 rounded border border-gray-200 p-3">
                    {processTagOptions.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <Checkbox
                          checked={selected.includes(option.id)}
                          onCheckedChange={(checked) =>
                            toggleTag(option.id, Boolean(checked))
                          }
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Materials
                  </p>
                  <div className="space-y-2 rounded border border-gray-200 p-3">
                    {materialTagOptions.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <Checkbox
                          checked={selected.includes(option.id)}
                          onCheckedChange={(checked) =>
                            toggleTag(option.id, Boolean(checked))
                          }
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </div>
  );
}
