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
  articleNamedEntityTester,
  articleArrayNamedEntityTester,
  articleInlineObjectTester,
  defaultArticleRenderers,
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

export {
  defaultEntityActionRegistry,
  showEntityAction,
  editEntityAction,
  openInNewTabAction,
  openInWindowAction,
  openInRouteAction,
  playableAudioAction,
} from "./entity-actions/defaultEntityActionRegistry";
export {
  createDeleteBulkEntry,
  createDeleteRowEntry,
  createMoveToTrashBulkEntry,
  createMoveToTrashRowEntry,
} from "./entity-actions/tableActionFactories";
export { EntityActionsBar } from "./entity-actions/EntityActionsBar";
export { useEntityContextMenu } from "./entity-actions/EntityContextMenu";
export { useEntityOpenHandlers } from "./entity-actions/useEntityOpenHandlers";
export { useExecuteEntityAction } from "./entity-actions/useExecuteEntityAction";
export { ViewDensityToggle } from "./entity-actions/ViewDensityToggle";

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
  ArticleLayoutRenderer,
  DetailHero,
  LabelRenderer,
  PropertyRow,
  NestedSection,
  nestingGuideSx,
  RelationViaRenderer,
  ArticleSection,
  ArticleInfoBox,
  ArticleNamedEntityRenderer,
  ArticleObjectRenderer,
  ArticleArrayEntityRenderer,
  StarsRenderer,
  StarsRating,
  starsTester,
  EntityListChipsRenderer,
  EntityListCardsRenderer,
  EntityListSearchRenderer,
  listVariantTester,
  DETAIL_LIST_VARIANT_OPTIONS_KEY,
} from "./renderers";
export type {
  NestedSectionProps,
  RelationViaAdornments,
  RelationViaRendererProps,
  ListVariant,
} from "./renderers";
