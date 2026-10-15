export * from "./jsonSchema";
export {
  extendDefinitionsWithProperties,
  prepareStubbedSchema,
} from "./stubHelper";
export type {
  GenRequiredPropertiesFunction,
  GeneratePropertiesFunction,
  RefAppendOptions,
  SchemaExpander,
} from "./stubHelper";
export * from "./resolver";
export { convertDefsToDefinitions } from "./defsToDefinitions";
export * from "./definitionScope";
export * from "./extendSchema";
export * from "./getSubschemaByPath";
export {
  getInversePropertyAnnotation,
  resolveInverseProperties,
  resolveInverseForProperty,
  getInverseProperties,
  inverseMapFromSchema,
  mergeInverseMaps,
  effectiveInverseMap,
  parseInverseTarget,
  inverseTargetFromLegacyPointer,
} from "./inversePropertyAnnotations";
export type {
  InverseMap,
  InversePropertyAnnotation,
  JSONSchemaWithInverseProperties,
  InversePropertyResolution,
  InversePropertyData,
  GetInversePropertiesOptions,
} from "./inversePropertyAnnotations";
export { assetKindForRef } from "./assetKindForRef";
export type { AssetKind, AssetKindContext } from "./assetKindForRef";
export * from "./extractTranslationKeysFromSchema";
export * from "./walkJSONSchema";
export * from "./schemaRegistry";
export * from "./schemaScopeFrame";
export * from "./schemaFingerprint";
export * from "./entityIdentity";
export * from "./cbdBoundary";
export { contentHash8, skolemListMemberIri, assignSkolemIris } from "./skolem";
export * from "./stripXCalcProperties";
