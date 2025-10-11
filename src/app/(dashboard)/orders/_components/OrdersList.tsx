import { useState, useMemo, useEffect } from 'react';
import OrderSearchBar from './OrderSearchBar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Order,
  ProcessTags,
  MaterialTags,
  MiscTags,
} from '@/lib/types/definitions';

// Combine all tag types
type TagType =
  | (typeof ProcessTags)[number]
  | (typeof MaterialTags)[number]
  | (typeof MiscTags)[number];

interface OrdersListProps {
  onOrderSelect: (orderId: Order) => void;
  unclaimedOrders?: Order[];
}

const OrdersList = ({ onOrderSelect, unclaimedOrders }: OrdersListProps) => {
  const orders = unclaimedOrders;
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if unclaimedOrders is not empty, then set loading to false
    if ((unclaimedOrders?.length ?? 0) > 0) {
      setLoading(false);
    }
  }, [unclaimedOrders]);

  const filteredOrders = useMemo(() => {
    // Filter orders based on search text and selected tags
    if (!orders) return [];

    return orders.filter((order) => {
      // Filter by search text
      const matchesSearch =
        searchText === '' ||
        order.title.toLowerCase().includes(searchText.toLowerCase()) ||
        order.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.id.toString().includes(searchText);

      // Filter by selected tags
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((selectedTag) =>
          order.tags?.some((orderTag) => orderTag === selectedTag.id)
        );

      return matchesSearch && matchesTags;
    });
  }, [orders, searchText, selectedTags]);

  return (
    <div>
      <OrderSearchBar
        onSearchChange={setSearchText}
        onTagsChange={setSelectedTags}
      />

      <div className="">
        <ScrollArea
          type={'auto'}
          className=" h-[22rem] w-full rounded-md border"
        >
          {loading && // Repeats skeleton 3 times
            [...Array(3)].map((e, i) => (
              <div key={i}>
                <ul>
                  <li className=" hover:bg-slate-50 ">
                    <div className="flex flex-col border-slate-200 border-b-2 p-2">
                      <div className="flex flex-row items-center gap-2">
                        <div className="h4">
                          <Skeleton className=" w-56 h-6" />
                        </div>
                      </div>

                      <div className="body-2 text-neutral-500 italic py-2">
                        <Skeleton className="w-32 h-3" />
                      </div>

                      <Separator />
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Skeleton className="w-12 h-3" />
                        <Skeleton className="w-12 h-3" />
                        <Skeleton className="w-12 h-3" />
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            ))}
          {!loading && filteredOrders.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No orders match your search criteria
            </div>
          ) : (
            <ul>
              {filteredOrders.map((order) => (
                <li
                  key={order.id}
                  onClick={() => onOrderSelect(order)}
                  className="cursor-pointer hover:bg-slate-50 "
                >
                  <div className="flex flex-col border-slate-200 border-b-2 p-2">
                    <div className="flex flex-row items-center gap-2">
                      <p className="h4">{order.title}</p>
                      <p className="text-neutral-500 text-sm">
                        #
                        {order.id.toLocaleString('en-US', {
                          minimumIntegerDigits: 6,
                          useGrouping: false,
                        })}
                      </p>
                    </div>

                    <p className="body-2 text-neutral-500 italic pb-2">
                      Created: {new Date(order.created_at).toLocaleString()}
                    </p>

                    <Separator />
                    <div className="pt-2 flex flex-wrap gap-2">
                      {order.tags?.map((tagId) => {
                        // Find tag details from all tag types
                        const allTags = [
                          ...ProcessTags,
                          ...MaterialTags,
                          ...MiscTags,
                        ];
                        const tagDetails = allTags.find((t) => t.id === tagId);

                        return (
                          <Badge
                            key={tagId}
                            variant={'outline'}
                            className=" text-xs"
                          >
                            {tagDetails?.label || tagId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default OrdersList;
