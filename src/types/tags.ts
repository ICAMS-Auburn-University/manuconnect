import {
  MaterialTag,
  MaterialTagLabels,
  MiscTag,
  MiscTagLabels,
  ProcessTag,
  ProcessTagLabels,
} from '@/types/enums';

export type TagId = ProcessTag | MaterialTag | MiscTag;

export type TagCategory = 'process' | 'material' | 'misc';

export type TagOption = {
  id: TagId;
  label: string;
  category: TagCategory;
};

export const processTagOptions: TagOption[] = Object.values(ProcessTag).map(
  (id) => ({
    id,
    label: ProcessTagLabels[id],
    category: 'process',
  })
);

export const materialTagOptions: TagOption[] = Object.values(MaterialTag).map(
  (id) => ({
    id,
    label: MaterialTagLabels[id],
    category: 'material',
  })
);

export const miscTagOptions: TagOption[] = Object.values(MiscTag).map((id) => ({
  id,
  label: MiscTagLabels[id],
  category: 'misc',
}));

export const allTagOptions: TagOption[] = [
  ...processTagOptions,
  ...materialTagOptions,
  ...miscTagOptions,
];

export const tagLabelMap: Record<string, string> = allTagOptions.reduce<
  Record<string, string>
>((acc, option) => {
  acc[option.id] = option.label;
  return acc;
}, {});

export const getTagLabel = (id: string): string => tagLabelMap[id] ?? id;
