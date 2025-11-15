import { z } from 'zod';

export const orderDetailsSchema = z.object({
  title: z.string().min(2, 'Project title must be at least 2 characters.'),
  description: z
    .string()
    .min(10, 'Please provide a more detailed project description.'),
  quantity: z.coerce
    .number({
      invalid_type_error: 'Quantity must be a number.',
    })
    .int('Quantity must be an integer.')
    .positive('Quantity must be greater than zero.'),
  dueDate: z
    .string()
    .min(1, 'Please select a due date.')
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      'Due date must be a valid date.'
    ),
  tags: z.array(z.string()).min(1, 'Select at least one tag for your project.'),
});

export const cadProcessingSchema = z.object({
  cadFile: z
    .any()
    .nullable()
    .refine((value) => {
      if (value === null) return false;
      if (typeof File === 'undefined') return true;
      return value instanceof File;
    }, 'Please upload a CAD file.'),
});

export const shippingSchema = z.object({
  shippingRecipient: z
    .string()
    .min(2, 'Recipient name must be at least 2 characters.'),
  shippingCompany: z.string().optional().or(z.literal('')),
  shippingAddress1: z
    .string()
    .min(3, 'Address line 1 must be at least 3 characters.'),
  shippingAddress2: z.string().optional().or(z.literal('')),
  shippingCity: z.string().min(2, 'City must be at least 2 characters.'),
  shippingState: z.string().min(2, 'State must be at least 2 characters.'),
  shippingZip: z
    .string()
    .min(5, 'Zip code must be at least 5 characters.')
    .max(10, 'Zip code must be at most 10 characters.'),
  shippingCountry: z.enum(['us'], {
    required_error: 'Currently only US shipping is supported.',
  }),
  shippingPhone: z
    .string()
    .min(7, 'Phone number must be at least 7 characters.'),
});

export const orderFormSchema = orderDetailsSchema
  .merge(cadProcessingSchema)
  .merge(shippingSchema);

export type OrderDetailsValues = z.infer<typeof orderDetailsSchema>;
export type CadProcessingValues = z.infer<typeof cadProcessingSchema>;
export type ShippingValues = z.infer<typeof shippingSchema>;
export type OrderFormValues = z.infer<typeof orderFormSchema>;
