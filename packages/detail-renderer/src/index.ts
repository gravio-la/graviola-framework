export * from "@graviola/edb-detail-renderer-core";

export { DetailRenderer } from "./DetailRenderer";
export type { DetailRendererRootProps } from "./DetailRenderer";
export type { GenerateDefaultDetailUISchemaOptions as GenerateDetailUISchemaOptions } from "@graviola/edb-detail-renderer-core";
export { EntitySummaryChip } from "./chips/EntitySummaryChip";
export type { EntitySummaryChipProps } from "./chips/EntitySummaryChip";
export { defaultChipsConfig, defaultChipRegistry } from "./chips/defaultChips";

export { DetailRendererContext, useDetailRendererContext } from "./context";
export type { DetailRendererContextValue } from "./context";

export { defaultDetailRenderers } from "./renderers";

export {
  FallbackRenderer,
  NumberRenderer,
  BooleanRenderer,
  DateRenderer,
  DateTimeRenderer,
  UriRenderer,
  EnumRenderer,
  EntityRefRenderer,
  ArrayEntityRenderer,
  ArrayPrimitiveRenderer,
  ObjectRenderer,
  VerticalLayoutRenderer,
  HorizontalLayoutRenderer,
  GroupRenderer,
  TopLevelLayoutRenderer,
  LabelRenderer,
  PropertyRow,
} from "./renderers";

export { EntityChipRenderer } from "./chips/renderers/EntityChipRenderer";
export { EnumChipRenderer } from "./chips/renderers/EnumChipRenderer";
export {
  MediaChipRenderer,
  IMAGE_EXT_RE,
} from "./chips/renderers/MediaChipRenderer";
export {
  PlayableChipRenderer,
  PLAYABLE_EXT_RE,
} from "./chips/renderers/PlayableChipRenderer";
export { SimpleLabelRenderer } from "./chips/renderers/SimpleLabelRenderer";
