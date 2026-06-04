import type { ComponentType } from "react";
import type { ViewSize } from "@graviola/semantic-jsonform-types";
import type { ContainedEntityComponentProps } from "@graviola/edb-detail-renderer";

import { ContainedSemanticChip } from "./ContainedSemanticChip";
import { SemanticCardNoOps } from "./SemanticCard";
import { SemanticListItemNoOps } from "./SemanticListItem";
import { SemanticDetailViewNoOps } from "./SemanticDetailView";

/** Default nested-entity components keyed by {@link ViewSize}. */
export const SemanticComponentMap: Partial<
  Record<ViewSize, ComponentType<ContainedEntityComponentProps>>
> = {
  chip: ContainedSemanticChip,
  listItem: SemanticListItemNoOps,
  card: SemanticCardNoOps,
  detail: SemanticDetailViewNoOps,
};
