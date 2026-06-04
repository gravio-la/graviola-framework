// Types
export type {
  ChipDefinition,
  ChipRendererEntry,
  ChipRendererProps,
  ChipsConfig,
  DetailArrayInlineControlOptions,
  DetailDispatch,
  DetailRendererProps,
  DetailRendererRegistryEntry,
  DetailTesterContext,
  DetailViewConfig,
  DetailTopLevelLayoutVariant,
  Tester,
  ViewSize,
} from "./types";

export { DETAIL_ARRAY_INLINE_OPTIONS_KEY } from "./types";

export type {
  ValueRendererEntry,
  ValueRendererProps,
} from "./value-renderers/types";
export {
  VALUE_RENDERER_OPTION,
  VALUE_RENDERER_OPTIONS_KEY,
} from "./value-renderers/types";
export {
  pickValueRenderer,
  readValueRendererOptions,
} from "./value-renderers/select";

export type { GenerateDefaultDetailUISchemaOptions as GenerateDetailUISchemaOptions } from "./uischema/generateDefault";

// Traversal
export { buildDispatch, resolvePropertySchema } from "./traverse/dispatch";
export {
  dataAtScope,
  dataInFrame,
  enterArrayDetailFrame,
  enterPropertyFrame,
  extendPropertyScope,
  pathFromScope,
  resolveInFrame,
  rootFrame,
} from "./traverse/scope";
export type { SchemaScopeFrame } from "./traverse/scope";

// Registry
export { selectEntry } from "./registry/select";
export {
  resolveConfigForType,
  resolveEffectiveUISchemaRoot,
} from "./registry/resolveConfig";

// UISchema generation
export {
  createControlElement,
  generateDefaultDetailUISchema,
} from "./uischema/generateDefault";
export type { GenerateDefaultDetailUISchemaOptions } from "./uischema/generateDefault";
export {
  generateDefaultCardUISchema,
  generateDefaultChipUISchema,
  generateDefaultListItemUISchema,
  generateDefaultViewUISchema,
} from "./uischema/generateViewLayouts";

// Testers
export * from "./testers";

// Chips
export { resolveChipRenderer } from "./chips/select";
export type { ChipResolution } from "./chips/select";

// Combinators (for custom renderers)
export { pickAnyOfBranch, pickOneOfBranch } from "./combinators/pickBranch";
export {
  AnyOfDetailRenderer,
  OneOfDetailRenderer,
} from "./renderers/anyOfOneOf";
