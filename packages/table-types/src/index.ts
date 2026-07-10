import type { JSONSchema7 } from "json-schema";
import maxBy from "lodash-es/maxBy";

export type TableScope = string;
export type ColumnVisibility = "visible" | "hiddenByDefault" | "forbidden";

export type TableUiSchemaColumn = {
  scope: TableScope;
  label?: string;
  rank?: number;
  width?: number;
  visibility?: ColumnVisibility;
  sortable?: boolean;
  filterable?: boolean;
  rendererHint?: string;
  /** SPARQL SELECT variable name without `?` (defaults from scope for meta columns). */
  sparqlOrderBy?: string;
  options?: Record<string, unknown>;
};

export type TableUiSchemaDefaultSort = {
  scope: TableScope;
  desc?: boolean;
};

export type TableUiSchema = {
  type: "Table";
  mode: "whitelist" | "blacklist";
  columns: TableUiSchemaColumn[];
  options?: Record<string, unknown> & {
    defaultSort?: TableUiSchemaDefaultSort;
  };
};

export type TableColumnDefFragment<TRow = unknown> = {
  id?: string;
  accessorKey?: string;
  accessorFn?: (row: TRow) => unknown;
  header?: unknown;
  Cell?: unknown;
  meta?: Record<string, unknown>;
  size?: number;
  minSize?: number;
  maxSize?: number;
  enableSorting?: boolean;
  enableColumnFilter?: boolean;
  filterFn?: unknown;
  sortingFn?: unknown;
};

export type TableTesterContext = {
  rootSchema: JSONSchema7;
  typeName: string;
  rowShape: "sparql-select" | "jsonld" | string;
  t?: (key: string, options?: any) => string;
  rendererHint?: string;
  uiSchemaOptions?: Record<string, unknown>;
  /** Primary field declaration for the row type (label/description/image keys). */
  primaryField?: {
    label?: string;
    description?: string;
    image?: string;
  };
  userPrefs?: {
    columnVisibility?: Record<string, boolean>;
  };
};

export type TableColumnTester = (
  schema: JSONSchema7,
  scope: TableScope,
  uiOptions: TableUiSchemaColumn | undefined,
  context: TableTesterContext,
) => number;

export type TableColumnRenderer<TRow = unknown> = (args: {
  schema: JSONSchema7;
  scope: TableScope;
  column: TableUiSchemaColumn | undefined;
  ctx: TableTesterContext;
}) => Partial<TableColumnDefFragment<TRow>>;

export type TableColumnRegistryEntry<TRow = unknown> = {
  tester: TableColumnTester;
  renderer: TableColumnRenderer<TRow>;
  name?: string;
};

export type TableColumnRegistry<TRow = unknown> =
  TableColumnRegistryEntry<TRow>[];

export type ResolvedColumn<TRow = unknown> = {
  id: string;
  visibility: ColumnVisibility;
  userToggleable: boolean;
  fragment: TableColumnDefFragment<TRow>;
};

export const composeTableRegistries = <TRow>(
  ...registries: TableColumnRegistry<TRow>[]
): TableColumnRegistry<TRow> => registries.flat();

export const selectTableRenderer = <TRow>(
  registry: TableColumnRegistry<TRow>,
  schema: JSONSchema7,
  scope: TableScope,
  uiOptions: TableUiSchemaColumn | undefined,
  context: TableTesterContext,
): TableColumnRegistryEntry<TRow> | null => {
  const rendererHint = uiOptions?.rendererHint || context.rendererHint;
  if (rendererHint) {
    const hinted = registry.find((entry) => entry.name === rendererHint);
    if (hinted) {
      return hinted;
    }
  }

  const best = maxBy(registry, (entry) =>
    entry.tester(schema, scope, uiOptions, context),
  );
  if (!best) {
    return null;
  }
  const rank = best.tester(schema, scope, uiOptions, context);
  return rank >= 0 ? best : null;
};

export {
  applyTableUiSchemaToColumns,
  buildColumnVisibilityFromTableUiSchema,
  filterForbiddenColumns,
  normalizeTableUiSchemaForRowShape,
  resolveActiveMetaAnnotationScopes,
  resolveColumnIdForScope,
  resolveDefaultSortingFromTableUiSchema,
  scopeToJsonLdColumnId,
} from "./columnVisibility";
