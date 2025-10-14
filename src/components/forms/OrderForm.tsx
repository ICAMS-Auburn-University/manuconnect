// im so sorry to whoever has to maintain this code.

'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { uploadFile } from '@/services/storage/uploadFile';
import Image from 'next/image';
import { useState } from 'react';
import { createOrder } from '@/domain/orders/service';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { OrderStatus } from '@/types/enums';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { materialTagOptions, processTagOptions } from '@/types/tags';

const formSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().min(2),
  quantity: z.coerce.number().int().positive(),
  due_date: z.date(),
  tags: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one item.',
  }),
  file:
    typeof window === 'undefined' ? z.any() : z.instanceof(FileList).optional(),
  shipping_address_1: z.string().min(2),
  shipping_address_2: z.string().min(2),
  shipping_city: z.string().min(2),
  shipping_state: z.string().min(2),
  shipping_zip: z.string().min(2).max(5),
  shipping_country: z.enum(['us']),
});

const OrderForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      quantity: 1,
      due_date: new Date(new Date().setDate(new Date().getDate() + 1)),
      tags: [],
      shipping_country: 'us',
      shipping_address_1: '',
      shipping_address_2: '',
      shipping_city: '',
      shipping_state: '',
      shipping_zip: '',
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    // Handle file upload

    let filePath: string | null = null;
    const file = values.file?.[0];

    if (file) {
      const { data, error } = await uploadFile(file);
      if (error) {
        setErrorMessage(error.message + '. Please try again.');
        setIsLoading(false);
        form.resetField('file');
        return;
      }
      filePath = data?.fullPath ?? null;
    }

    try {
      // Save the form data to the database.

      const { error: createError } = await createOrder({
        id: 0, // Placeholder, will be set in createOrder function
        title: values.title,
        description: values.description,
        creator: 'Placeholder', // Placeholder, will be set in createOrder function
        creator_name: 'Placeholder Name', // Placeholder, replace with actual data
        creator_email: 'placeholder@example.com', // Placeholder, replace with actual data
        status: OrderStatus.OrderCreated,
        created_at: new Date(),
        last_update: new Date(),
        manufacturer: '',
        manufacturer_name: 'Placeholder Manufacturer', // Placeholder, replace with actual data
        quantity: values.quantity,
        due_date: values.due_date,
        fileURLs: filePath ?? '',
        tags: values.tags,
        delivery_address: {
          street: values.shipping_address_1 + ' ' + values.shipping_address_2,
          city: values.shipping_city,
          state: values.shipping_state,
          postal_code: values.shipping_zip,
          country: values.shipping_country,
        },
        isArchived: false,
        offers: [], // Default empty array
        selected_offer: 0, // Default null
        shipping_info: { tracking_number: '', carrier: '' }, // Default empty object
        livestream_url: '', // Default empty string
        price: {
          unit_cost: 0,
          projected_cost: 0,
          projected_units: 0,
          shipping_cost: 0,
        }, // Default price object
      });

      if (createError) {
        setErrorMessage(createError + '. Please try again.');
        setIsLoading(false);
        return;
      }
      toast.success('Order created successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
    }
    // Clear form
    form.reset();
    setIsLoading(false);
  }

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="details" className="w-1/2">
          Order Details
        </TabsTrigger>
        <TabsTrigger value="shipping" className="w-1/2">
          Shipping Info.
        </TabsTrigger>
      </TabsList>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/*
            DETAILS TAB
            */}
          <TabsContent value="details" className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="h4">Project Title</FormLabel>
                  <FormDescription></FormDescription>
                  <FormControl>
                    <Input
                      placeholder="Give your project a title."
                      {...field}
                    />
                  </FormControl>

                  <FormMessage className="text-error" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="">Project Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="h-32"
                      placeholder="Give your project a detailed description. This includes materials to use, color, and any other important details."
                      {...field}
                    />
                  </FormControl>

                  <FormMessage className="text-error" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => {
                const selectedTags = field.value ?? [];
                const toggleTag = (tagId: string, checked: boolean) => {
                  const nextTags = checked
                    ? [...selectedTags, tagId]
                    : selectedTags.filter((value) => value !== tagId);

                  field.onChange(nextTags);
                };

                return (
                  <FormItem>
                    <div>
                      <FormLabel>Tags:</FormLabel>
                      <FormDescription className="italic">
                        Please choose all the tags that apply to your project.
                        These tags help us match you with the right
                        manufacturer.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="space-y-1">
                        <FormLabel className="font-bold">Process:</FormLabel>
                        {processTagOptions.map((option) => (
                          <div
                            key={option.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={selectedTags.includes(option.id)}
                                onCheckedChange={(checked) =>
                                  toggleTag(option.id, Boolean(checked))
                                }
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {option.label}
                            </FormLabel>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <FormLabel className="font-bold">Materials:</FormLabel>
                        {materialTagOptions.map((option) => (
                          <div
                            key={option.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={selectedTags.includes(option.id)}
                                onCheckedChange={(checked) =>
                                  toggleTag(option.id, Boolean(checked))
                                }
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {option.label}
                            </FormLabel>
                          </div>
                        ))}
                      </div>
                    </div>
                    <FormMessage className="text-error" />
                  </FormItem>
                );
              }}
            />

            {/* Add more fields here */}
            <div className="grid grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CAD File</FormLabel>
                    <FormDescription></FormDescription>
                    <FormControl className="hover:cursor-pointer">
                      <Input
                        type="file"
                        className="hover:cursor-pointer"
                        ref={field.ref}
                        onChange={(event) => field.onChange(event.target.files)}
                      />
                    </FormControl>
                    <FormMessage className="text-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel className="text-right">
                      Projected Units
                    </FormLabel>
                    <FormDescription></FormDescription>
                    <FormControl>
                      <Input
                        placeholder=""
                        type="number"
                        className="w-[240px] ml-auto"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-error" />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Projected Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-white"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date <= new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>You can change this later.</FormDescription>
                  <FormMessage className="text-error" />
                </FormItem>
              )}
            />
          </TabsContent>

          {/*
            SHIPPING TAB
            */}
          <TabsContent value="shipping" className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shipping_address_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormDescription></FormDescription>
                    <FormControl>
                      <Input placeholder="123 Main St." {...field} />
                    </FormControl>

                    <FormMessage className="text-error" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shipping_address_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2</FormLabel>
                    <FormDescription></FormDescription>
                    <FormControl>
                      <Input placeholder="Suite 123" {...field} />
                    </FormControl>

                    <FormMessage className="text-error" />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="shipping_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormDescription></FormDescription>
                    <FormControl>
                      <Input placeholder="Auburn" {...field} />
                    </FormControl>
                    <FormMessage className="text-error" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shipping_state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormDescription></FormDescription>
                    <FormControl>
                      <Input placeholder="AL" {...field} />
                    </FormControl>
                    <FormMessage className="text-error" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shipping_zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip Code</FormLabel>
                    <FormDescription></FormDescription>
                    <FormControl>
                      <Input placeholder="36830" {...field} />
                    </FormControl>
                    <FormMessage className="text-error" />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="shipping_country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormDescription></FormDescription>
                  <FormControl>
                    <Select
                      disabled
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">
                          United States of America
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="text-error" />
                </FormItem>
              )}
            />
          </TabsContent>
          <Button
            type="submit"
            className="bg-brand px-2 py-1 h-fit hover:bg-brand-100 transition text-white text-base"
            disabled={isLoading}
          >
            Submit
            {isLoading && (
              <Image
                src="/loader.svg"
                alt="loader"
                width={24}
                height={24}
                className="ml-2 animate-spin"
              />
            )}
          </Button>
        </form>
        {errorMessage && <p className="error-message"> *{errorMessage}</p>}
      </Form>
    </Tabs>
  );
};

export default OrderForm;
