# `@graviola/edb-table-renderer-sparql-select`

**Graviola role:** tissue · column registry for SPARQL SELECT result rows

**Tissue** package — `TableColumnRegistry` for rows that are SPARQL SELECT result sets: each cell value is an RDF term object `{ value, type, datatype?, "xml:lang"? }`.

Exports `sparqlSelectColumnRegistry`, a ranked tester/renderer array covering:

| name                          | matches                          |
| ----------------------------- | -------------------------------- |
| primitive string / number     | plain literals                   |
| IRI link                      | `xsd:anyURI` or IRI-shaped value |
| enum / oneOf                  | `schema.oneOf` / `schema.enum`   |
| boolean                       | `xsd:boolean`                    |
| array object → markdown links | array of object refs             |
| object ref chip               | `$ref` / object with `@id`       |

The registry is consumed by `SemanticTable` when `rowShape="sparql-select"`.

## Extension

Append or prepend entries to `sparqlSelectColumnRegistry`, or pass a composed registry via `SemanticTable`'s `columnRegistry` prop:

```ts
import {
  sparqlSelectColumnRegistry,
  composeTableRegistries,
} from "@graviola/edb-table-renderer-sparql-select";

const myRegistry = composeTableRegistries(
  [{ tester: myTester, renderer: myRenderer, name: "custom:price" }],
  sparqlSelectColumnRegistry,
);
```

## Related packages

- `@graviola/edb-table-types` — spine; defines the registry contract
- `@graviola/edb-table-renderer-jsonld` — parallel registry for JSON-LD document rows
- `@graviola/edb-table-components` — integrates both registries into `SemanticTable`
