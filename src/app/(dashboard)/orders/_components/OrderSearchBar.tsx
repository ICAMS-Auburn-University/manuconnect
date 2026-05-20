import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  materialTagOptions,
  miscTagOptions,
  processTagOptions,
  TagOption,
} from '@/types/tags';
import type { SortOption, QuickFilter } from '@/components/dashboard/BrowseOrdersCard';

interface OrderSearchBarProps {
  className?: string;
  onSearchChange?: (search: string) => void;
  onTagsChange?: (selectedTags: TagOption[]) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
  resultCount: number;
  totalCount: number;
}

const OrderSearchBar = ({
  className,
  onSearchChange,
  onTagsChange,
  sortBy,
  onSortChange,
  quickFilter,
  onQuickFilterChange,
  resultCount,
  totalCount,
}: OrderSearchBarProps) => {
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    if (onSearchChange) onSearchChange(value);
  };

  const handleTagSelect = (tag: TagOption) => {
    if (!selectedTags.some((t) => t.id === tag.id)) {
      const newSelectedTags = [...selectedTags, tag];
      setSelectedTags(newSelectedTags);
      if (onTagsChange) onTagsChange(newSelectedTags);
    }
  };

  const handleTagRemove = (tagToRemove: TagOption) => {
    const newSelectedTags = selectedTags.filter(
      (tag) => tag.id !== tagToRemove.id
    );
    setSelectedTags(newSelectedTags);
    if (onTagsChange) onTagsChange(newSelectedTags);
  };

  const clearSearch = () => {
    setSearchText('');
    if (onSearchChange) onSearchChange('');
  };

  const isTagSelected = (tagId: string) => {
    return selectedTags.some((tag) => tag.id === tagId);
  };

  return (
    <div className={twMerge('flex flex-col space-y-2', className)}>
      {/* Search + Sort row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Search orders..."
            className="pl-10 pr-10 h-9"
          />
          {searchText && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[160px] h-9">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="due-date">Due soonest</SelectItem>
            <SelectItem value="fewest-offers">Fewest offers</SelectItem>
            <SelectItem value="most-offers">Most offers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['all', 'no-offers', 'matching', 'not-offered'] as QuickFilter[]).map(
          (filter) => {
            const labels: Record<QuickFilter, string> = {
              all: 'All',
              'no-offers': 'No offers',
              matching: 'Matches shop',
              'not-offered': "Haven't offered",
            };
            return (
              <Button
                key={filter}
                variant={quickFilter === filter ? 'default' : 'outline'}
                size="sm"
                className={`h-7 text-xs ${
                  quickFilter === filter
                    ? 'bg-[#0c2340] hover:bg-[#0c2340]/90 text-white'
                    : ''
                }`}
                onClick={() => onQuickFilterChange(filter)}
              >
                {labels[filter]}
              </Button>
            );
          }
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {resultCount} of {totalCount} orders
        </span>
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="flex items-center gap-1 text-xs"
          >
            {tag.label}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleTagRemove(tag)}
            />
          </Badge>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 text-xs px-2">
              <SlidersHorizontal className="h-3 w-3 mr-1" />
              Tags
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-96 p-0 bg-white" align="start">
            <Tabs defaultValue="process">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="process">Process</TabsTrigger>
                <TabsTrigger value="material">Material</TabsTrigger>
                <TabsTrigger value="misc">Misc</TabsTrigger>
              </TabsList>
              <TabsContent value="process" className="p-1">
                <div className="grid grid-cols-2 gap-1">
                  {processTagOptions.map((tag) => (
                    <Button
                      key={tag.id}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left text-sm font-normal"
                      onClick={() => handleTagSelect(tag)}
                      disabled={isTagSelected(tag.id)}
                    >
                      {tag.label}
                    </Button>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="material" className="p-1">
                <div className="grid grid-cols-2 gap-1">
                  {materialTagOptions.map((tag) => (
                    <Button
                      key={tag.id}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left text-sm font-normal"
                      onClick={() => handleTagSelect(tag)}
                      disabled={isTagSelected(tag.id)}
                    >
                      {tag.label}
                    </Button>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="misc" className="p-1">
                <div className="grid grid-cols-2 gap-1">
                  {miscTagOptions.map((tag) => (
                    <Button
                      key={tag.id}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left text-sm font-normal"
                      onClick={() => handleTagSelect(tag)}
                      disabled={isTagSelected(tag.id)}
                    >
                      {tag.label}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default OrderSearchBar;
