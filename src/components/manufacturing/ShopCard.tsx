import { Clock, Factory, Globe, MapPin, Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TONE } from '@/lib/utils/tones';
import type { ShopCardData } from '@/domain/manufacturing/profile';

interface ShopCardProps {
  name: string;
  data: ShopCardData;
  className?: string;
  /** Show gentle placeholders for empty fields (used in the owner's preview). */
  showEmptyHints?: boolean;
}

const MAX_BADGES = 6;

function safeWebsite(value: string): { href: string; label: string } | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return { href: url.toString(), label: url.hostname.replace(/^www\./, '') };
  } catch {
    return null;
  }
}

function BadgeGroup({
  label,
  items,
  className,
}: {
  label: string;
  items: string[];
  className?: string;
}) {
  if (items.length === 0) return null;
  const shown = items.slice(0, MAX_BADGES);
  const extra = items.length - shown.length;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((item) => (
          <Badge
            key={item}
            variant="outline"
            className={cn('text-[11px] font-medium', className)}
          >
            {item}
          </Badge>
        ))}
        {extra > 0 && (
          <Badge variant="outline" className="text-[11px] font-medium">
            +{extra} more
          </Badge>
        )}
      </div>
    </div>
  );
}

export function ShopCard({
  name,
  data,
  className,
  showEmptyHints = false,
}: ShopCardProps) {
  const website = safeWebsite(data.website);

  return (
    <div
      className={cn(
        'space-y-4 rounded-xl border border-border/70 bg-card p-4 text-card-foreground shadow-sm',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Factory className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {name || 'Your company'}
          </p>
          {data.location ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{data.location}</span>
            </p>
          ) : (
            showEmptyHints && (
              <p className="text-sm italic text-muted-foreground">
                Add a location
              </p>
            )
          )}
        </div>
      </div>

      {data.description ? (
        <p className="whitespace-pre-line text-sm leading-6 text-foreground/90">
          {data.description}
        </p>
      ) : (
        showEmptyHints && (
          <p className="text-sm italic text-muted-foreground">
            Add a short description so creators know what your shop does best.
          </p>
        )
      )}

      {(data.typicalLeadTimeWeeks !== null ||
        data.minOrderQuantity !== null ||
        website) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {data.typicalLeadTimeWeeks !== null && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Typical lead time {data.typicalLeadTimeWeeks}{' '}
              {data.typicalLeadTimeWeeks === 1 ? 'week' : 'weeks'}
            </span>
          )}
          {data.minOrderQuantity !== null && (
            <span className="inline-flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Min. order {data.minOrderQuantity.toLocaleString()}
            </span>
          )}
          {website && (
            <a
              href={website.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 text-brand hover:underline"
            >
              <Globe className="h-3.5 w-3.5" />
              {website.label}
            </a>
          )}
        </div>
      )}

      <BadgeGroup label="Processes" items={data.processes} className={TONE.blue} />
      <BadgeGroup
        label="Materials"
        items={data.materialCategories}
        className={TONE.green}
      />
      <BadgeGroup
        label="Certifications"
        items={data.certifications}
        className={TONE.purple}
      />
    </div>
  );
}
