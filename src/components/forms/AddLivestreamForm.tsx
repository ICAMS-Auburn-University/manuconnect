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

const formSchema = z.object({
  livestreamUrl: z
    .string({
      required_error: 'Please enter a livestream URL.',
    })
    .url({ message: 'Please enter a valid URL.' }),
});

interface AddLivestreamFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formValues: { livestreamUrl: string }) => void;
}

const AddLivestreamForm = ({
  open,
  onOpenChange,
  onSubmit,
}: AddLivestreamFormProps) => {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      livestreamUrl: '',
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
          <DialogTitle>Add Livestream</DialogTitle>
          <DialogDescription>
            Please enter the URL of the livestream. Only YouTube is supported
            currently.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="livestreamUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Livestream URL*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://youtube.com/watch?v="
                      {...field}
                    />
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

export default AddLivestreamForm;
