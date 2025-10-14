import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  materialTagOptions,
  miscTagOptions,
  processTagOptions,
  TagOption,
} from '@/types/tags';

interface OrderSearchBarProps {
  className?: string;
  onSearchChange?: (search: string) => void;
  onTagsChange?: (selectedTags: TagOption[]) => void;
}

const OrderSearchBar = ({
  className,
  onSearchChange,
  onTagsChange,
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
    <div className={twMerge('flex flex-col space-y-2 mb-2', className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchText}
          onChange={handleSearchChange}
          placeholder="Search orders..."
          className="pl-10 pr-10"
        />
        {searchText && (
          <button
            onClick={clearSearch}
            className="absolute right-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="flex items-center gap-1 border-black"
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
            <Button variant="outline" size="sm" className="h-7">
              Filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className=" min-w-96 p-0 bg-white" align="start">
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
                      className="justify-start text-left text-sm font-normal border-black"
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
