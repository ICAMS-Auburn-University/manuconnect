import type { PartSummary } from './types';

export interface PartTreeNode {
  id: string;
  label: string;
  path: string;
  part?: PartSummary;
  children: PartTreeNode[];
}

const sortNodes = (nodes: PartTreeNode[]) => {
  nodes.sort((a, b) => {
    const aIsLeaf = Boolean(a.part);
    const bIsLeaf = Boolean(b.part);

    if (aIsLeaf !== bIsLeaf) {
      return aIsLeaf ? 1 : -1;
    }

    return a.label.localeCompare(b.label);
  });

  nodes.forEach((node) => sortNodes(node.children));
};

export function buildPartTree(parts: PartSummary[]): PartTreeNode[] {
  const root: PartTreeNode[] = [];
  const nodeIndex = new Map<string, PartTreeNode>();

  parts.forEach((part) => {
    const hierarchy = part.hierarchy ?? [];
    let parentPath = '';
    let siblings = root;

    hierarchy.forEach((segment) => {
      const currentPath = parentPath ? `${parentPath}/${segment}` : segment;
      parentPath = currentPath;

      let node = nodeIndex.get(currentPath);

      if (!node) {
        node = {
          id: currentPath,
          label: segment,
          path: currentPath,
          children: [],
        };
        nodeIndex.set(currentPath, node);
        siblings.push(node);
      }

      siblings = node.children;
    });

    const partPath = parentPath ? `${parentPath}/${part.name}` : part.name;

    const leaf: PartTreeNode = {
      id: part.storagePath,
      label: part.name,
      path: partPath,
      part,
      children: [],
    };

    nodeIndex.set(part.storagePath, leaf);
    siblings.push(leaf);
  });

  sortNodes(root);
  return root;
}
