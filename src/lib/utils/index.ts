import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OrderStatus } from '@/types/enums';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getNextOrderStatus = (
  currentStatus: OrderStatus
): OrderStatus | null => {
  const statuses = Object.values(OrderStatus);
  const currentIndex = statuses.indexOf(currentStatus);

  if (currentIndex === -1 || currentIndex === statuses.length - 1) {
    return null;
  }

  return statuses[currentIndex + 1];
};
