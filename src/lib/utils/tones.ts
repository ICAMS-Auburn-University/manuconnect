// Full class strings so Tailwind can detect them; every tone has a dark variant.
import { OrderStatus } from '@/types/enums';

export const TONE = {
  neutral:
    'border-border bg-muted text-muted-foreground',
  blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300',
  indigo:
    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300',
  purple:
    'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300',
  teal: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300',
  green:
    'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300',
  emerald:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
  yellow:
    'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-300',
  amber:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
  orange:
    'border-orange-200 bg-orange-50 text-[#e87722] dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300',
  red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
} as const;

export type Tone = keyof typeof TONE;

export const ORDER_STATUS_TONE: Record<string, Tone> = {
  [OrderStatus.OrderCreated]: 'neutral',
  [OrderStatus.ManufacturerOffer]: 'yellow',
  [OrderStatus.OrderAccepted]: 'blue',
  [OrderStatus.MachineSetup]: 'indigo',
  [OrderStatus.StartedManufacturing]: 'orange',
  [OrderStatus.QualityCheck]: 'purple',
  [OrderStatus.Shipped]: 'teal',
  [OrderStatus.Completed]: 'green',
};
