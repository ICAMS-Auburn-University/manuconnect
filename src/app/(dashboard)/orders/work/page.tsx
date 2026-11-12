import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccountType } from '@/domain/users/service';
import { getManufacturerWorkQueue } from '@/domain/manufacturing/dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { daysUntil } from '@/lib/utils/dates';

export default async function WorkQueuePage({ searchParams }: {
  searchParams: Promise<{ queue?: string }>;
}) {
  const [accountType, { queue }] = await Promise.all([getAccountType(), searchParams]);
  if (accountType !== 'manufacturer' && accountType !== 'admin') redirect('/orders');

  const showingParts = queue === 'parts';
  let work: Awaited<ReturnType<typeof getManufacturerWorkQueue>> | null = null;
  try {
    work = await getManufacturerWorkQueue();
  } catch {
    work = null;
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Work queue</h1>
        <Button asChild variant="outline"><Link href="/">Back to dashboard</Link></Button>
      </div>
      <nav className="flex gap-2" aria-label="Work queues">
        <Button asChild variant={showingParts ? 'outline' : 'default'}><Link href="/orders/work?queue=due">Due soon</Link></Button>
        <Button asChild variant={showingParts ? 'default' : 'outline'}><Link href="/orders/work?queue=parts">Assigned parts</Link></Button>
      </nav>
      {!work ? <p role="alert" className="text-destructive">Unable to load your work queue. Refresh to try again.</p> : showingParts ? (
        work.partOrders.length ? <div className="divide-y border-y">
          {work.partOrders.map(({ order, parts }) => <section key={order.id} className="space-y-3 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">{order.title}</h2>
              <Button asChild variant="outline" size="sm"><Link href={`/orders/${order.id}?tab=collaboration`}>Open collaboration</Link></Button>
            </div>
            <ul className="space-y-2">{parts.map((part) => <li key={part.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{part.name}</span><Badge variant="outline">{part.status}</Badge>
            </li>)}</ul>
          </section>)}
        </div> : <p className="text-muted-foreground">No assigned parts are waiting to be shipped.</p>
      ) : work.dueOrders.length ? <div className="divide-y border-y">
        {work.dueOrders.map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div><h2 className="font-semibold">{order.title}</h2><p className="text-sm text-muted-foreground">Due {new Date(order.due_date).toLocaleDateString()} {daysUntil(order.due_date) < 0 ? '(overdue)' : ''} · {order.status}</p></div>
          <Button asChild variant="outline" size="sm"><Link href={`/orders/${order.id}`}>Open job</Link></Button>
        </div>)}
      </div> : <p className="text-muted-foreground">No active jobs are due in the next seven days.</p>}
    </main>
  );
}