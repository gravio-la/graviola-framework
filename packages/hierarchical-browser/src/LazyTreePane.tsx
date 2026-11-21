import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import type { ReactNode } from "react";

import type { ChildrenListingSource, ListingSort } from "./types";
import { useLazyChildren } from "./useLazyChildren";

const LOADING_SUFFIX = "::loading";
const LOAD_MORE_SUFFIX = "::load-more";

export type LazyTreePaneProps<T = Record<string, unknown>> = {
  source: ChildrenListingSource<T>;
  /**
   * When null/undefined, top level comes from `listRoots`.
   * When set, top level is children of this parent id.
   */
  rootParentId?: string | null;
  expandedIds: string[];
  onExpandedIdsChange: (ids: string[]) => void;
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  getItemId: (doc: T) => string;
  getItemLabel: (doc: T) => ReactNode;
  sort?: ListingSort[];
  pageSize?: number;
  /** Prefer `listExpandableChildren` when available (default true). */
  expandableOnly?: boolean;
  loadMoreLabel?: ReactNode;
  loadingLabel?: ReactNode;
  emptyLabel?: ReactNode;
  queryKeyPrefix?: string;
};

type TreeBranchProps<T> = {
  parentId: string | null;
  source: ChildrenListingSource<T>;
  expandedIds: string[];
  getItemId: (doc: T) => string;
  getItemLabel: (doc: T) => ReactNode;
  sort?: ListingSort[];
  pageSize?: number;
  expandableOnly: boolean;
  loadMoreLabel: ReactNode;
  loadingLabel: ReactNode;
  queryKeyPrefix?: string;
  enabled: boolean;
};

function TreeBranch<T>({
  parentId,
  source,
  expandedIds,
  getItemId,
  getItemLabel,
  sort,
  pageSize,
  expandableOnly,
  loadMoreLabel,
  loadingLabel,
  queryKeyPrefix,
  enabled,
}: TreeBranchProps<T>) {
  const controller = useLazyChildren(parentId, source, {
    enabled,
    sort,
    pageSize,
    expandableOnly,
    queryKeyPrefix,
  });

  const branchKey = parentId ?? "__roots__";

  if (controller.isLoading && !controller.hasLoaded) {
    return (
      <TreeItem
        itemId={`${branchKey}${LOADING_SUFFIX}`}
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={14} />
            <Typography variant="body2" color="text.secondary">
              {loadingLabel}
            </Typography>
          </Box>
        }
        disabled
      />
    );
  }

  return (
    <>
      {controller.documents.map((doc) => {
        const id = getItemId(doc);
        const isExpanded = expandedIds.includes(id);
        const canExpand =
          typeof source.isExpandable === "function"
            ? source.isExpandable(doc)
            : true;
        return (
          <TreeItem key={id} itemId={id} label={getItemLabel(doc)}>
            {canExpand ? (
              isExpanded ? (
                <TreeBranch
                  parentId={id}
                  source={source}
                  expandedIds={expandedIds}
                  getItemId={getItemId}
                  getItemLabel={getItemLabel}
                  sort={sort}
                  pageSize={pageSize}
                  expandableOnly={expandableOnly}
                  loadMoreLabel={loadMoreLabel}
                  loadingLabel={loadingLabel}
                  queryKeyPrefix={queryKeyPrefix}
                  enabled
                />
              ) : (
                // Placeholder so the expand affordance appears before first expand.
                // After expand+empty load, branch renders no children → no arrow.
                <TreeItem
                  itemId={`${id}${LOADING_SUFFIX}`}
                  label={loadingLabel}
                  disabled
                />
              )
            ) : null}
          </TreeItem>
        );
      })}
      {controller.hasNextPage ? (
        <TreeItem
          itemId={`${branchKey}${LOAD_MORE_SUFFIX}`}
          label={
            <Typography
              variant="body2"
              color="primary"
              component="span"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                controller.fetchNextPage();
              }}
              sx={{ cursor: "pointer" }}
            >
              {controller.isFetchingNextPage ? loadingLabel : loadMoreLabel}
            </Typography>
          }
        />
      ) : null}
    </>
  );
}

/**
 * Controlled lazy `SimpleTreeView`. One query per expanded node via `useLazyChildren`.
 * Empty loaded nodes render without children (no expand arrow). Unexpanded nodes
 * keep a disabled placeholder child so they remain expandable until proven empty.
 */
export function LazyTreePane<T = Record<string, unknown>>({
  source,
  rootParentId = null,
  expandedIds,
  onExpandedIdsChange,
  selectedId = null,
  onSelectedIdChange,
  getItemId,
  getItemLabel,
  sort,
  pageSize,
  expandableOnly = true,
  loadMoreLabel = "Load more",
  loadingLabel = "Loading…",
  emptyLabel = "No items",
  queryKeyPrefix,
}: LazyTreePaneProps<T>) {
  // Shared query with TreeBranch (same key) — used only for top-level empty state.
  const roots = useLazyChildren(rootParentId, source, {
    enabled: true,
    sort,
    pageSize,
    expandableOnly,
    queryKeyPrefix,
  });

  const showEmpty =
    roots.hasLoaded && !roots.isLoading && roots.documents.length === 0;

  return (
    <Box sx={{ px: 0.5 }}>
      {showEmpty ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 1, py: 1 }}
        >
          {emptyLabel}
        </Typography>
      ) : (
        <SimpleTreeView
          expandedItems={expandedIds}
          onExpandedItemsChange={(_event, itemIds) => {
            onExpandedIdsChange(itemIds as string[]);
          }}
          selectedItems={selectedId ?? ""}
          onSelectedItemsChange={(_event, itemId) => {
            if (!onSelectedIdChange) return;
            const id = typeof itemId === "string" ? itemId : null;
            if (
              id &&
              (id.endsWith(LOADING_SUFFIX) || id.endsWith(LOAD_MORE_SUFFIX))
            ) {
              return;
            }
            onSelectedIdChange(id || null);
          }}
        >
          <TreeBranch
            parentId={rootParentId}
            source={source}
            expandedIds={expandedIds}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            sort={sort}
            pageSize={pageSize}
            expandableOnly={expandableOnly}
            loadMoreLabel={loadMoreLabel}
            loadingLabel={loadingLabel}
            queryKeyPrefix={queryKeyPrefix}
            enabled
          />
        </SimpleTreeView>
      )}
    </Box>
  );
}
