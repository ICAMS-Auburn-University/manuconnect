'use client';

import { forwardRef } from 'react';

import { Input } from '@/components/ui/input';

interface OrderDueDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  minDate?: Date;
}

export const OrderDueDatePicker = forwardRef<
  HTMLInputElement,
  OrderDueDatePickerProps
>(function OrderDueDatePicker({ value, onChange, minDate }, ref) {
  const min = minDate ? minDate.toISOString().split('T')[0] : undefined;

  return (
    <Input
      ref={ref}
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      min={min}
    />
  );
});
