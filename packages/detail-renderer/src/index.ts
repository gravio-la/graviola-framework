export * from "@graviola/edb-detail-renderer-core";

export { DetailRenderer } from "./DetailRenderer";
export type { DetailRendererRootProps } from "./DetailRenderer";
export {
  createDetailEntityModal,
  DetailEntityModal,
  DetailEntityModalView,
  type DetailEntityModalHeaderActionsProps,
  type DetailEntityModalStaticConfig,
  type DetailEntityModalViewProps,
  DetailEntityModalPortalContext,
  useDetailEntityModalPortalContainer,
} from "./DetailEntityModal";
export type { GenerateDefaultDetailUISchemaOptions as GenerateDetailUISchemaOptions } from "@graviola/edb-detail-renderer-core";
export {
  defaultChipRenderers,
  defaultListItemRenderers,
  defaultCardRenderers,
} from "./renderers/registries";
export {
  MotionAdapterProvider,
  NoopMotionAdapter,
  useMotionAdapter,
} from "./motion/MotionAdapter";
export type { MotionAdapter } from "./motion/MotionAdapter";

export { DetailRendererContext, useDetailRendererContext } from "./context";
export type {
  ContainedEntityComponentProps,
  DetailRendererContextValue,
} from "./context";

export { useEntityRefClickHandler } from "./hooks/useEntityRefClickHandler";

export { previewChipAvatar, previewChipIcon } from "./preview/PreviewAvatar";

export { defaultDetailRenderers } from "./renderers";

export {
  defaultValueRenderers,
  renderValueWithRow,
  formatCurrencyValue,
  CurrencyValueRenderer,
  formatHistoricalDate,
  HistoricalDateValueRenderer,
  ImageValueRenderer,
} from "./value-renderers";

export {
  FallbackRenderer,
  NumberRenderer,
  BooleanRenderer,
  DateRenderer,
  DateTimeRenderer,
  UriRenderer,
  EnumRenderer,
  NamedEntityRenderer,
  ArrayEntityRenderer,
  ArrayPrimitiveRenderer,
  ArrayInlineObjectRenderer,
  ObjectRenderer,
  VerticalLayoutRenderer,
  HorizontalLayoutRenderer,
  GroupRenderer,
  TopLevelLayoutRenderer,
  LabelRenderer,
  PropertyRow,
} from "./renderers";
