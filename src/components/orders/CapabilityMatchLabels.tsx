import type { CapabilityMatch } from '@/domain/manufacturing/browse';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TONE } from '@/lib/utils/tones';

const labels: Record<CapabilityMatch, string> = {
  match: 'matches',
  mismatch: 'does not match',
  unknown: 'unknown',
};

export function CapabilityMatchLabels({ process, material }: {
  process: CapabilityMatch;
  material: CapabilityMatch;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {([['Process', process], ['Material', material]] as const).map(([name, status]) => (
        <Badge key={name} variant="outline" className={cn('text-xs font-normal',
          status === 'match' ? TONE.green : status === 'mismatch' ? TONE.red : TONE.neutral)}>
          {name} {labels[status]}
        </Badge>
      ))}
    </div>
  );
}