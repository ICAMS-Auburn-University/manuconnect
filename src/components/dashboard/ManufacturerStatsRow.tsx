import Link from 'next/link';
import { CalendarClock, HandCoins, Package, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ManufacturerDashboardStats } from '@/domain/manufacturing/dashboard';

interface StatCardProps {
  href: string;
  label: string;
  hint: string;
  value: number;
  icon: React.ReactNode;
  attention?: 'none' | 'warn' | 'danger';
}

function StatCard({ href, label, hint, value, icon, attention = 'none' }: StatCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/50',
        attention === 'warn' && 'border-amber-300 dark:border-amber-800',
        attention === 'danger' && 'border-red-300 dark:border-red-900'
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none text-foreground">
          {value}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
    </Link>
  );
}

export function ManufacturerStatsRow({
  stats,
}: {
  stats: ManufacturerDashboardStats;
}) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        href="/orders?tab=offers&filter=pending"
        label="Open offers"
        hint="Waiting on a creator"
        value={stats.openOffers}
        icon={<HandCoins className="h-5 w-5" />}
      />
      <StatCard
        href="/orders"
        label="Active jobs"
        hint="Accepted and in progress"
        value={stats.activeJobs}
        icon={<Wrench className="h-5 w-5" />}
      />
      <StatCard
        href="/orders/work?queue=due"
        label="Due this week"
        hint="Including overdue"
        value={stats.dueThisWeek}
        icon={<CalendarClock className="h-5 w-5" />}
        attention={stats.dueThisWeek > 0 ? 'danger' : 'none'}
      />
      <StatCard
        href="/orders/work?queue=parts"
        label="Assigned parts"
        hint="Not yet shipped"
        value={stats.partsToShip}
        icon={<Package className="h-5 w-5" />}
        attention={stats.partsToShip > 0 ? 'warn' : 'none'}
      />
    </div>
  );
}
