import type {
  CachePolicy,
  DataSource,
  HostPolicy,
  ParamBinding,
} from "@graviola/data-acquisition";
import { z } from "zod";

export type Candidate = {
  id: string;
  iri: string;
  label: string;
  description?: string;
  thumbnail?: string;
  typeHints?: string[];
  raw?: unknown;
};

export type ReconciliationHit = {
  authorityIRI: string;
  iri: string;
  sourceId?: string;
};

export type ExampleExpect = {
  minItems?: number;
  containsId?: string;
  jsonPathExists?: string[];
};

export type ExampleQuery = {
  id: string;
  label: string;
  operation: "search" | "getEntity" | string;
  input: Record<string, unknown>;
  expect?: ExampleExpect;
};

export type ExampleResult = {
  ok: boolean;
  assertions: Array<{ pass: boolean; message: string }>;
  durationMs: number;
  provenance?: unknown;
  sample?: unknown;
};

export type SearchShape = {
  itemsPath?: string | string[];
  labelPath?: string;
  idPath?: string;
  descriptionPath?: string;
  thumbnailPath?: string;
};

/** Partial searchByType entry merged onto operations.search when `kind` is omitted. */
export type SearchOverride = SearchShape & {
  id?: string;
  label?: string;
  kind?: DataSource["kind"];
  method?: "GET" | "POST";
  url?: string;
  params?: Record<string, ParamBinding>;
  query?: Record<string, ParamBinding>;
  headers?: Record<string, string | ParamBinding>;
  body?: ParamBinding;
  responseFormat?: "json" | "yaml" | "text";
  hostPolicy?: string;
  cache?: CachePolicy;
  record?: "never" | "on-error" | "always";
  license?: string;
};

export type GetEntityShape = {
  documentPath?: string;
  idToIri?: string;
  iriToId?: Array<{ pattern: string; as: string }>;
};

export type FactsPreview = {
  paths: Record<string, string>;
};

export type IdentifierSpec = {
  path: string;
  authorityIRI: string;
  iriTemplate: string;
};

export type AuthSpec =
  | { mode: "none" }
  | {
      mode: "bearer" | "header" | "basic";
      secretRef: string;
      header?: string;
    }
  | {
      mode: "pre-login";
      login: DataSource;
      tokenPath: string;
      ttlSeconds?: number;
      inject: { header: string; template: string };
    };

export type SecondaryDataSourceDeclaration = {
  id: string;
  label: string;
  description?: string;
  authorityIRI: string;
  icon?: string;
  license?: string;
  homepage?: string;
  enabled: boolean;
  kind: "declarative" | "adapter";
  adapterId?: string;
  auth?: AuthSpec;
  rateLimit?: HostPolicy;
  cache?: CachePolicy;
  typeHints?: Record<string, string | string[]>;
  operations: {
    search: DataSource & SearchShape;
    searchByType?: Record<string, (DataSource & SearchShape) | SearchOverride>;
    getEntity: DataSource & GetEntityShape;
    factsPreview?: FactsPreview;
  };
  identifiers?: IdentifierSpec[];
  examples: ExampleQuery[];
};

// --- Zod schemas (for validation on registry upsert) ---

const paramBindingSchema = z.union([
  z.object({ kind: z.literal("const"), value: z.unknown() }),
  z.object({
    kind: z.literal("path"),
    from: z.enum(["input", "document", "row"]),
    path: z.union([z.string(), z.array(z.string())]),
    take: z.enum(["first", "all"]).optional(),
    default: z.unknown().optional(),
    required: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal("template"),
    template: z.string(),
    params: z.record(
      z.string(),
      z.lazy(() => paramBindingSchema),
    ),
  }),
]);

const dataSourceBaseSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  hostPolicy: z.string().optional(),
  cache: z
    .union([
      z.object({ disabled: z.literal(true) }),
      z.object({
        disabled: z.literal(false).optional(),
        maxAgeSeconds: z.number().optional(),
        keyPrefix: z.string().optional(),
      }),
    ])
    .optional(),
  record: z.enum(["never", "on-error", "always"]).optional(),
  license: z.string().optional(),
});

const restSourceSchema = dataSourceBaseSchema.extend({
  kind: z.literal("rest"),
  method: z.enum(["GET", "POST"]).optional(),
  url: z.string(),
  params: z.record(z.string(), paramBindingSchema).optional(),
  query: z.record(z.string(), paramBindingSchema).optional(),
  headers: z
    .record(z.string(), z.union([z.string(), paramBindingSchema]))
    .optional(),
  body: paramBindingSchema.optional(),
  itemsPath: z.union([z.string(), z.array(z.string())]).optional(),
  responseFormat: z.enum(["json", "yaml", "text"]).optional(),
});

const entityByIriSourceSchema = dataSourceBaseSchema.extend({
  kind: z.literal("entity-by-iri"),
  authorityIRI: z.string(),
  url: z.string(),
  documentPath: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

const adapterSourceSchema = dataSourceBaseSchema.extend({
  kind: z.literal("adapter"),
  authorityIRI: z.string().optional(),
});

const dataSourceSchema = z.union([
  restSourceSchema,
  entityByIriSourceSchema,
  adapterSourceSchema,
]);

const authSpecSchema = z.union([
  z.object({ mode: z.literal("none") }),
  z.object({
    mode: z.enum(["bearer", "header", "basic"]),
    secretRef: z.string(),
    header: z.string().optional(),
  }),
  z.object({
    mode: z.literal("pre-login"),
    login: dataSourceSchema,
    tokenPath: z.string(),
    ttlSeconds: z.number().optional(),
    inject: z.object({ header: z.string(), template: z.string() }),
  }),
]);

const searchShapeSchema = z.object({
  itemsPath: z.union([z.string(), z.array(z.string())]).optional(),
  labelPath: z.string().optional(),
  idPath: z.string().optional(),
  descriptionPath: z.string().optional(),
  thumbnailPath: z.string().optional(),
});

const searchByTypeOverrideSchema = searchShapeSchema.merge(
  z.object({
    id: z.string().optional(),
    label: z.string().optional(),
    kind: z.enum(["rest", "entity-by-iri", "adapter"]).optional(),
    method: z.enum(["GET", "POST"]).optional(),
    url: z.string().optional(),
    params: z.record(z.string(), paramBindingSchema).optional(),
    query: z.record(z.string(), paramBindingSchema).optional(),
    headers: z
      .record(z.string(), z.union([z.string(), paramBindingSchema]))
      .optional(),
    body: paramBindingSchema.optional(),
    responseFormat: z.enum(["json", "yaml", "text"]).optional(),
    hostPolicy: z.string().optional(),
    cache: z
      .union([
        z.object({ disabled: z.literal(true) }),
        z.object({
          disabled: z.literal(false).optional(),
          maxAgeSeconds: z.number().optional(),
          keyPrefix: z.string().optional(),
        }),
      ])
      .optional(),
    record: z.enum(["never", "on-error", "always"]).optional(),
    license: z.string().optional(),
  }),
);

const exampleQuerySchema = z.object({
  id: z.string(),
  label: z.string(),
  operation: z.string(),
  input: z.record(z.string(), z.unknown()),
  expect: z
    .object({
      minItems: z.number().optional(),
      containsId: z.string().optional(),
      jsonPathExists: z.array(z.string()).optional(),
    })
    .optional(),
});

export const secondaryDataSourceDeclarationSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  authorityIRI: z.string().url(),
  icon: z.string().optional(),
  license: z.string().optional(),
  homepage: z.string().url().optional(),
  enabled: z.boolean(),
  kind: z.enum(["declarative", "adapter"]),
  adapterId: z.string().optional(),
  auth: authSpecSchema.optional(),
  rateLimit: z
    .object({
      minIntervalMs: z.number().optional(),
      max: z.number().optional(),
      windowMs: z.number().optional(),
    })
    .optional(),
  cache: z
    .union([
      z.object({ disabled: z.literal(true) }),
      z.object({
        disabled: z.literal(false).optional(),
        maxAgeSeconds: z.number().optional(),
        keyPrefix: z.string().optional(),
      }),
    ])
    .optional(),
  typeHints: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
  operations: z.object({
    search: dataSourceSchema.and(searchShapeSchema),
    searchByType: z
      .record(
        z.string(),
        z.union([
          dataSourceSchema.and(searchShapeSchema),
          searchByTypeOverrideSchema,
        ]),
      )
      .optional(),
    getEntity: dataSourceSchema.and(
      z.object({
        documentPath: z.string().optional(),
        idToIri: z.string().optional(),
        iriToId: z
          .array(z.object({ pattern: z.string(), as: z.string() }))
          .optional(),
      }),
    ),
    factsPreview: z
      .object({ paths: z.record(z.string(), z.string()) })
      .optional(),
  }),
  identifiers: z
    .array(
      z.object({
        path: z.string(),
        authorityIRI: z.string(),
        iriTemplate: z.string(),
      }),
    )
    .optional(),
  examples: z.array(exampleQuerySchema),
});

export type SecondaryDataSourceDeclarationInput = z.infer<
  typeof secondaryDataSourceDeclarationSchema
>;

export const mappingDeclarationYamlSchema = z.array(
  z.object({
    source: z.object({
      path: z.union([z.string(), z.array(z.string())]),
      expectedSchema: z.unknown().optional(),
    }),
    target: z.object({ path: z.string() }),
    mapping: z
      .object({ strategy: z.record(z.string(), z.unknown()) })
      .optional(),
  }),
);
