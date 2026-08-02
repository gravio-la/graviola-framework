import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { JsonView } from "react-json-view-lite";
import { YasguiSPARQLEditor } from "@graviola/edb-debug-utils";
import type Yasgui from "@triply/yasgui";
import type { Prefixes } from "@graviola/edb-core-types";
import type { TableUiSchema } from "@graviola/edb-table-types";
import {
  SemanticTableView,
  composeJsonLdColumns,
  JsonLdTableProvider,
} from "@graviola/edb-table-components";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";
import "react-json-view-lite/dist/index.css";

export type FilterPipelineShowcaseProps = {
  /** Human-readable description of the filter scenario */
  description: string;
  /** Type name being queried (City / Place / …) */
  typeName: string;
  /** Filter options passed to buildFilterableSPARQLQuery / filterMany */
  filterOptions: Record<string, unknown>;
  /** Generated SPARQL CONSTRUCT string */
  sparqlQuery: string;
  /** Prefix map for Yasgui */
  prefixMap: Prefixes;
  /** Schema (full document with $defs) for table column composition */
  schema: JSONSchema7;
  /** Table UI schema for column whitelist */
  tableUiSchema: TableUiSchema;
  /** Typed JSON-LD documents from filterMany */
  documents: Record<string, unknown>[] | null;
  /** Loading / error state for the live query */
  status: "idle" | "loading" | "ready" | "error";
  errorMessage?: string;
  /** Elapsed ms for the live filterMany call */
  elapsedMs?: number;
  /** Optional callout (e.g. known gap vs issue #5) */
  note?: string;
  /** Expected result count when known (for play assertions) */
  expectedCount?: number;
};

/**
 * Presentational three-column filter → SPARQL → result pipeline plus a
 * JSON-LD table. Computation lives in the parent / story.
 */
export const FilterPipelineShowcase: React.FC<FilterPipelineShowcaseProps> = ({
  description,
  typeName,
  filterOptions,
  sparqlQuery,
  prefixMap,
  schema,
  tableUiSchema,
  documents,
  status,
  errorMessage,
  elapsedMs,
  note,
  expectedCount,
}) => {
  const [showYasgui, setShowYasgui] = useState(false);

  const loadedSchema = useMemo(
    () => bringDefinitionToTop(schema, typeName),
    [schema, typeName],
  );

  const columns = useMemo(
    () =>
      composeJsonLdColumns(loadedSchema, {
        typeName,
        tableUiSchema,
        t: (key) => key,
        locale: "en",
      }),
    [loadedSchema, typeName, tableUiSchema],
  );

  const columnOrder = useMemo(
    () => columns.map((col) => String(col.id ?? "")).filter(Boolean),
    [columns],
  );

  const rows = documents ?? [];
  const count = rows.length;

  return (
    <Box sx={{ p: 1 }} data-testid="filter-pipeline-showcase">
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" component="h2">
          {description}
        </Typography>
        <Chip size="small" label={`typeName: ${typeName}`} />
        {status === "ready" && (
          <Chip
            size="small"
            color="success"
            label={`${count} result${count === 1 ? "" : "s"}`}
            data-testid="filter-result-count"
            data-count={count}
          />
        )}
        {typeof elapsedMs === "number" && status === "ready" && (
          <Chip size="small" variant="outlined" label={`${elapsedMs} ms`} />
        )}
        {typeof expectedCount === "number" && (
          <Chip
            size="small"
            variant="outlined"
            label={`expected ≈ ${expectedCount}`}
            data-testid="filter-expected-count"
            data-expected={expectedCount}
          />
        )}
      </Box>

      {note && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {note}
        </Alert>
      )}

      <Grid container direction="row" wrap="nowrap" spacing={2} sx={{ mb: 3 }}>
        <Grid
          item
          flex={1}
          sx={{ minWidth: 0, maxHeight: "55vh", overflow: "auto" }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            1 · Filter
          </Typography>
          <JsonView data={filterOptions} shouldExpandNode={(lvl) => lvl < 4} />
        </Grid>

        <Grid
          item
          flex={1}
          sx={{ minWidth: 0, maxHeight: "55vh", overflow: "auto" }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              2 · Generated SPARQL
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => setShowYasgui(!showYasgui)}
            >
              {showYasgui ? "Hide" : "Open"} Yasgui
            </Button>
          </Box>
          <Box
            component="pre"
            sx={{
              margin: 0,
              padding: 2,
              backgroundColor: "#282c34",
              color: "#abb2bf",
              borderRadius: 1,
              overflow: "auto",
              fontFamily: "Consolas, Monaco, monospace",
              fontSize: "11px",
              lineHeight: 1.45,
              maxHeight: "48vh",
            }}
          >
            <code>{sparqlQuery}</code>
          </Box>
        </Grid>

        <Grid
          item
          flex={1}
          sx={{ minWidth: 0, maxHeight: "55vh", overflow: "auto" }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            3 · Raw result
          </Typography>
          {status === "loading" && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          )}
          {status === "error" && (
            <Alert severity="error">{errorMessage ?? "Query failed"}</Alert>
          )}
          {status === "ready" && (
            <JsonView
              data={rows.slice(0, 25)}
              shouldExpandNode={(lvl) => lvl < 2}
            />
          )}
          {status === "ready" && rows.length > 25 && (
            <Typography variant="caption" color="text.secondary">
              Showing first 25 of {rows.length} documents in the JSON view.
            </Typography>
          )}
        </Grid>
      </Grid>

      {showYasgui && (
        <Box sx={{ mb: 3, p: 2, bgcolor: "#f8f9fa", borderRadius: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Yasgui SPARQL Editor
          </Typography>
          <Box sx={{ minHeight: 420 }}>
            <YasguiSPARQLEditor
              prefixes={prefixMap as Prefixes}
              onInit={(yasgui: Yasgui) => {
                const firstTabId = yasgui.persistentConfig.currentId();
                const firstTab = yasgui.getTab(firstTabId);
                const yasqe = firstTab?.getYasqe();
                if (yasqe) yasqe.setValue(sparqlQuery);
              }}
            />
          </Box>
        </Box>
      )}

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        4 · Table (JSON-LD)
      </Typography>
      <JsonLdTableProvider
        value={{
          typeIRIToTypeName: (iri) => {
            const hash = iri.lastIndexOf("#");
            return hash >= 0 ? iri.slice(hash + 1) : iri;
          },
          locale: "en",
        }}
      >
        <Box sx={{ height: 360, display: "flex" }}>
          <SemanticTableView
            typeName={typeName}
            columns={columns}
            data={rows}
            rowCount={rows.length}
            columnOrder={columnOrder}
            pagination={{ pageIndex: 0, pageSize: 10 }}
            onPaginationChange={() => {}}
            sorting={[]}
            onSortingChange={() => {}}
            manualPagination={false}
            locale="en"
            isLoading={status === "loading"}
          />
        </Box>
      </JsonLdTableProvider>
    </Box>
  );
};
