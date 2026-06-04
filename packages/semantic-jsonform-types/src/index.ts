import type { JsonLdContext } from "jsonld-context-parser";
import type { JSONSchema7 } from "json-schema";
import type { ErrorObject } from "ajv";
import type { JsonFormsInitStateProps } from "@jsonforms/react";
import type { ReactNode } from "react";
import type {
  IRIToStringFn,
  NormDataMapping,
  SparqlBuildOptions,
  StringToIRIFn,
  TypePresentationRegistry,
} from "@graviola/edb-core-types";
import type { JSONLDConfig } from "@graviola/edb-global-types";
import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonFormsUISchemaRegistryEntry,
} from "@jsonforms/core";
import type { TableColumnRegistry } from "@graviola/edb-table-types";

export type ChangeCause = "user" | "mapping" | "reload";
export type AuthorityConfiguration = {
  authorityIRI: string;
  getEntityByIRI: (iri: string) => Promise<any>;
};

export type SemanticJsonFormProps = {
  entityIRI?: string | undefined;
  data: any;
  onChange: (data: any) => void;
  shouldLoadInitially?: boolean;
  typeIRI: string;
  schema: JSONSchema7;
  jsonldContext: JsonLdContext;
  debugEnabled?: boolean;
  jsonFormsProps?: Partial<JsonFormsInitStateProps>;
  onEntityChange?: (entityIRI: string | undefined) => void;
  onEntityDataChange?: (entityData: any) => void;
  defaultPrefix: string;
  hideToolbar?: boolean;
  forceEditMode?: boolean;
  defaultEditMode?: boolean;
  searchText?: string;
  toolbarChildren?: ReactNode;
  disableSimilarityFinder?: boolean;
  enableSidebar?: boolean;
  wrapWithinCard?: boolean;
  /** When set, invoked instead of emitting `entity-saved` on the intent bus. */
  onSaveSuccess?: (payload: { entityIRI?: string; created: boolean }) => void;
  /** When set, invoked instead of emitting `entity-save-failed` on the intent bus. */
  onSaveError?: (error: Error) => void;
  /** Passed through to the similarity finder modal; when false, hides result-row detail Popper. */
  enableResultDetailPopper?: boolean;
};

export type LoadResult = {
  document: any;
};

export type SemanticJsonFormNoOpsProps = {
  typeIRI: string;
  data: any;
  onChange?: (data: any, reason: ChangeCause) => void;
  onError?: (errors: ErrorObject[]) => void;
  schema: JSONSchema7;
  jsonFormsProps?: Partial<JsonFormsInitStateProps>;
  onEntityChange?: (entityIRI: string | undefined) => void;
  onEntityDataChange?: (entityData: any) => void;
  toolbar?: ReactNode;
  forceEditMode?: boolean;
  defaultEditMode?: boolean;
  searchText?: string;
  disableSimilarityFinder?: boolean;
  enableSidebar?: boolean;
  wrapWithinCard?: boolean;
  formsPath?: string;
  disabled?: boolean;
  /** Passed through to the similarity finder modal; when false, hides result-row detail Popper. */
  enableResultDetailPopper?: boolean;
};
export type SemanticJsonFormShellProps = SemanticJsonFormNoOpsProps;

export type KnowledgeSources = "kb" | "gnd" | "wikidata" | "k10plus" | "ai";

export type EntityFinderProps<
  FindResultType = any,
  FullEntityType = any,
  SourceType extends string = string,
> = {
  finderId: string;
  classIRI: string;
  jsonSchema: JSONSchema7;
  onEntityIRIChange?: (entityIRI: string | undefined) => void;
  onMappedDataAccepted?: (data: any) => void;
  onExistingEntityAccepted?: (entityIRI: string, data: any) => void;
  onSelectedEntityChange?: (id: string, authorityIRI: string) => void;
  search?: string;
  data?: any;
  prepareNewEntityData?: (data: any) => Promise<any>;
  onSearchChange?: (search: string) => void;
  hideFooter?: boolean;
  knowledgeSources?: SourceType[];
  additionalKnowledgeSources?: SourceType[];
  allKnowledgeBases?: FinderKnowledgeBaseDescription<
    FindResultType,
    FullEntityType,
    SourceType
  >[];
  /** When false, selected search results do not open the side detail Popper. Default true. */
  enableResultDetailPopper?: boolean;
};

export type GlobalSemanticConfig = {
  typeNameToTypeIRI: StringToIRIFn;
  typeIRIToTypeName: IRIToStringFn;
  createEntityIRI: (typeName: string, id?: string) => string;
  propertyNameToIRI: StringToIRIFn;
  propertyIRIToPropertyName: IRIToStringFn;
  jsonLDConfig: JSONLDConfig;
  queryBuildOptions: SparqlBuildOptions;
};

export type {
  DetailViewConfigOptions,
  GenerateDefaultViewUISchemaOptions,
  ViewConfig,
  ViewConfigSet,
  ViewRendererRegistryEntry,
  ViewSize,
} from "./viewConfig";

/** @deprecated Use `viewConfig.detail.options` via {@link resolveViewConfig}. */
export type { DetailViewConfigOptions as LegacyDetailViewConfigOptions } from "./viewConfig";

export type GlobalAppConfig<DeclarativeMappingType> = GlobalSemanticConfig & {
  normDataMapping?: Record<string, NormDataMapping<DeclarativeMappingType>>;
  authorityAccess?: Record<string, AuthorityConfiguration>;
  schema: JSONSchema7;
  makeStubSchema?: (schema: JSONSchema7) => JSONSchema7;
  uiSchemaDefaultRegistry?: JsonFormsUISchemaRegistryEntry[];
  rendererRegistry?: JsonFormsRendererRegistryEntry[];
  cellRendererRegistry?: JsonFormsCellRendererRegistryEntry[];
  uischemata?: Record<string, any>;
  viewConfig?: import("./viewConfig").ViewConfigSet;
  typePresentation?: TypePresentationRegistry;
  /** @deprecated Use `viewConfig.detail.options` */
  detailViewConfig?: import("./viewConfig").DetailViewConfigOptions;
  tableColumnRegistry?: TableColumnRegistry;
  tableActionRegistry?: any[];
};

export type EditEntityModalProps = {
  typeIRI: string | undefined;
  entityIRI: string;
  data: any;
  disableLoad?: boolean;
  /** Controlled errors: when provided with onErrorsChange, caller handles validation errors. */
  errors?: ErrorObject[];
  onErrorsChange?: (errors: ErrorObject[]) => void;
  /** When true, save/accept is disabled while there are validation errors. Default false. */
  preventSaveOnError?: boolean;
  /** When true, hide the tooltip and error badge on the accept button. Default false. */
  disableErrorBadge?: boolean;
  /** When set, invoked instead of emitting `entity-saved` on the intent bus after save. */
  onSaveSuccess?: () => void;
  /** When set, invoked instead of emitting `entity-save-failed` on the intent bus. */
  onSaveError?: (error: Error) => void;
};

export type EntityDetailModalProps = EditEntityModalProps & {
  readonly?: boolean;
  disableInlineEditing?: boolean;
  /** When set, invoked instead of `modal.remove()` (e.g. browser history `navigate(-1)`). */
  onClose?: () => void;
};

export type SelectedEntity<SourceType extends string = string> = {
  id: string;
  source: SourceType;
};
export type FindOptions = {
  limit?: number;
  page?: number;
  offset?: number;
  pageSize?: number;
};

export type ListItemRendererProps<
  FindResultType = any,
  FullEntityType = any,
> = {
  data: FullEntityType;
  idx: number;
  typeIRI: string;
  selected: boolean;
  onSelect?: (id: string, index: number) => void;
  onAccept?: (id: string, data: FullEntityType) => void;
};

export type FinderKnowledgeBaseDescription<
  FindResultType = any,
  FullEntityType = any,
  SourceType extends string = string,
> = {
  id: SourceType;
  authorityIRI?: string;
  label: string;
  description: string;
  icon: string | ReactNode;
  find: (
    searchString: string,
    typeIRI: string,
    typeName: string,
    findOptions?: FindOptions,
  ) => Promise<FindResultType[]>;
  getEntity?: (id: string, typeIRI?: string) => Promise<FullEntityType>;
  detailRenderer?: (id: string) => ReactNode;
  listItemRenderer?: (
    entry: FindResultType,
    idx: number,
    typeIRI: string,
    selected: boolean,
    onSelect?: (id: string, index: number) => void,
    onAccept?: (id: string, entry: FindResultType) => void,
  ) => ReactNode;
};

export type MapDataFromAuthorityFn = (
  id: string | undefined,
  classIRI: string,
  entryData: any,
  authorityIRI: string,
  limit?: number,
) => Promise<any>;
