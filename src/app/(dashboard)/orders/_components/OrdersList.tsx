import { useState, useMemo } from 'react';
import OrderSearchBar from './OrderSearchBar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { OrdersSchema } from '@/types/schemas';
import type { TagOption } from '@/types/tags';
import { getTagLabel } from '@/types/tags';
import { abbreviateUUID } from '@/lib/utils/transforms';
import type { BrowseOrderData } from '@/domain/orders/browse';
import type { SortOption, QuickFilter } from '@/components/dashboard/BrowseOrdersCard';
import {
  Clock,
  Flame,
  Package2,
  Sparkles,
  CheckCircle2,
  Wrench,
  AlertTriangle,
} from 'lucide-react';

interface OrdersListProps {
  onOrderSelect: (order: OrdersSchema) => void;
  browseData: BrowseOrderData[];
  loading: boolean;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
  selectedOrderId: string | null;
  totalCount: number;
}

function formatDueDate(dueDate: string, daysUntilDue: number): string {
  if (daysUntilDue <= 0) return 'Overdue';
  if (daysUntilDue === 1) return 'Due tomorrow';
  if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
  if (daysUntilDue <= 30) return `Due in ${Math.ceil(daysUntilDue / 7)} weeks`;
  return new Date(dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function OfferCountBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50 text-xs font-medium">
        No offers yet
      </Badge>
    );
  }
  if (count <= 3) {
    return (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-xs font-medium">
        <Flame className="h-3 w-3 mr-1" />
        {count} offer{count > 1 ? 's' : ''}
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 text-xs font-medium">
      <Flame className="h-3 w-3 mr-1" />
      {count} offers
    </Badge>
  );
}

function DueBadge({
  dueDate,
  daysUntilDue,
  urgency,
}: {
  dueDate: string;
  daysUntilDue: number;
  urgency: string;
}) {
  const text = formatDueDate(dueDate, daysUntilDue);
  if (urgency === 'urgent') {
    return (
      <span className="inline-flex items-center text-xs text-red-600 font-medium">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {text}
      </span>
    );
  }
  if (urgency === 'soon') {
    return (
      <span className="inline-flex items-center text-xs text-amber-600 font-medium">
        <Clock className="h-3 w-3 mr-1" />
        {text}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs text-muted-foreground">
      <Clock className="h-3 w-3 mr-1" />
      {text}
    </span>
  );
}

const OrdersList = ({
  onOrderSelect,
  browseData,
  loading,
  sortBy,
  onSortChange,
  quickFilter,
  onQuickFilterChange,
  selectedOrderId,
  totalCount,
}: OrdersListProps) => {
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);

  const filteredOrders = useMemo(() => {
    return browseData.filter(({ order }) => {
      const matchesSearch =
        searchText === '' ||
        order.title.toLowerCase().includes(searchText.toLowerCase()) ||
        order.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.id.toString().includes(searchText);

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((selectedTag) =>
          order.tags?.some((orderTag) => orderTag === selectedTag.id)
        );

      return matchesSearch && matchesTags;
    });
  }, [browseData, searchText, selectedTags]);

  return (
    <div>
      <OrderSearchBar
        onSearchChange={setSearchText}
        onTagsChange={setSelectedTags}
        sortBy={sortBy}
        onSortChange={onSortChange}
        quickFilter={quickFilter}
        onQuickFilterChange={onQuickFilterChange}
        resultCount={filteredOrders.length}
        totalCount={totalCount}
      />

      <ScrollArea type="auto" className="h-[32rem] w-full rounded-md border mt-2">
        {loading &&
          [...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border-b">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="w-48 h-5" />
                <Skeleton className="w-20 h-5 rounded-full" />
              </div>
              <div className="flex gap-3 mb-2">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-20 h-4" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-16 h-5 rounded-full" />
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
            </div>
          ))}

        {!loading && filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Package2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No orders match your criteria</p>
            <p className="text-sm mt-1">Try adjusting your filters or search</p>
          </div>
        ) : (
          <div>
            {filteredOrders.map(
              ({
                order,
                offerCount,
                userHasOffered,
                dueUrgency,
                daysUntilDue,
                isNew,
                tagMatchesProfile,
              }) => {
                const isSelected = order.id === selectedOrderId;
                return (
                  <div
                    key={order.id}
                    onClick={() => onOrderSelect(order)}
                    className={`cursor-pointer border-b transition-colors p-4 ${
                      isSelected
                        ? 'bg-slate-50 border-l-2 border-l-[#e87722]'
                        : 'hover:bg-slate-50/50 border-l-2 border-l-transparent'
                    }`}
                  >
                    {/* Row 1: Title + Offer count */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {order.title}
                        </h4>
                        <span className="text-xs text-muted-foreground shrink-0">
                          #{abbreviateUUID(order.id)}
                        </span>
                      </div>
                      <OfferCountBadge count={offerCount} />
                    </div>

                    {/* Row 2: Meta info */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <DueBadge
                        dueDate={order.due_date}
                        daysUntilDue={daysUntilDue}
                        urgency={dueUrgency}
                      />
                      <span className="text-xs text-muted-foreground">
                        Qty: {order.quantity}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Row 3: Status pills + Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isNew && (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 text-[10px] font-medium px-1.5 py-0">
                          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                          NEW
                        </Badge>
                      )}
                      {dueUrgency === 'urgent' && offerCount < 3 && (
                        <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 text-[10px] font-medium px-1.5 py-0">
                          URGENT
                        </Badge>
                      )}
                      {userHasOffered && (
                        <Badge className="bg-orange-50 text-[#e87722] border-orange-200 hover:bg-orange-50 text-[10px] font-medium px-1.5 py-0">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                          YOU OFFERED
                        </Badge>
                      )}
                      {tagMatchesProfile && !userHasOffered && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px] font-medium px-1.5 py-0">
                          <Wrench className="h-2.5 w-2.5 mr-0.5" />
                          MATCHES SHOP
                        </Badge>
                      )}
                      {order.tags?.slice(0, 3).map((tagId) => (
                        <Badge
                          key={tagId}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {getTagLabel(tagId)}
                        </Badge>
                      ))}
                      {(order.tags?.length ?? 0) > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{(order.tags?.length ?? 0) - 3}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default OrdersList;
