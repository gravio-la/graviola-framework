/**
 * Schema registry: maps logical type names (e.g. `"Item"`) to entity shapes.
 * Zod path: `Record<"Item", z.infer<typeof ItemSchema>>`.
 * JSON Schema–only path: values may be `unknown` / `any`.
 */
export type SchemaRegistry = Record<string, unknown>;

/** Entity type for key `K` in registry `R`. */
export type EntityOf<
  R extends SchemaRegistry,
  K extends keyof R & string,
> = R[K];
