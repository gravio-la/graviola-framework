import { Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  PropertyRow,
  isControl,
  rankWith,
  type DetailRendererProps,
  type DetailRendererRegistryEntry,
  type Tester,
} from "@graviola/edb-detail-renderer";
import {
  baseStatementSchemaProfile,
  STATEMENT_DEFINITION,
  STATEMENT_JSON_SUFFIX,
  STATEMENT_PERSISTENCE_SUFFIX,
} from "@graviola/statement-meta";
import type { ControlElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import {
  isCalcAnnotatedSchema,
  type CalcSchemaAnnotation,
  X_CALC,
} from "../demo/annotateCalcSchema";
import { calcDebug } from "../demo/calcDebug";
import { readSiblingStatements } from "../demo/demoProvenance";
import { showSchemaDrivenDetail } from "../modals/SchemaDrivenDetailModal";

const isCalcField: Tester = (_uischema, schema) =>
  isCalcAnnotatedSchema(schema as JSONSchema7) ? 1 : 0;

function formatCalcValue(
  value: unknown,
  display: CalcSchemaAnnotation["display"],
): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (display === "currency") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "EUR",
    }).format(n);
  }
  if (display === "area") {
    return `${new Intl.NumberFormat("en-GB", {
      maximumFractionDigits: 2,
    }).format(n)} m²`;
  }
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 4,
  }).format(n);
}

function parentRecord(
  rootData: unknown,
  path: string[],
): Record<string, unknown> | undefined {
  if (!rootData || typeof rootData !== "object") return undefined;
  let cur: unknown = rootData;
  for (const segment of path.slice(0, -1)) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[segment];
  }
  return cur && typeof cur === "object"
    ? (cur as Record<string, unknown>)
    : undefined;
}

function statementListSchema(): JSONSchema7 {
  return {
    type: "object",
    definitions: {
      [STATEMENT_DEFINITION]: {
        ...baseStatementSchemaProfile,
        properties: {
          ...((baseStatementSchemaProfile.properties ?? {}) as Record<
            string,
            JSONSchema7
          >),
          // Prefer number/string in the demo modal so DetailRenderer does not
          // pick the boolean control for JSON Schema union types.
          value: { type: ["number", "string"] },
        },
      },
    },
    properties: {
      statements: {
        type: "array",
        items: { $ref: `#/definitions/${STATEMENT_DEFINITION}` },
      },
    },
  };
}

export function ComputedFieldRenderer({
  label,
  data,
  schema,
  path,
  rootData,
}: DetailRendererProps) {
  const calc = (schema as JSONSchema7 & { [X_CALC]?: CalcSchemaAnnotation })[
    X_CALC
  ]!;
  const propertyName = path[path.length - 1] ?? "";
  const parent = parentRecord(rootData, path);
  const statementList = readSiblingStatements(parent, propertyName);

  const openProvenance = () => {
    calcDebug("open computed provenance", calc.scope, statementList);
    const payload =
      statementList.length > 0
        ? { statements: statementList }
        : {
            statements: [
              {
                value: data as string | number | boolean,
                source: "demo:live-eval",
                wasGeneratedBy: {
                  formulaId: calc.scope,
                  stratum: calc.stratum,
                  generatedAt: new Date().toISOString(),
                },
              },
            ],
          };
    void showSchemaDrivenDetail({
      title: `Provenance · ${label}`,
      data: payload,
      schema: statementListSchema(),
    });
  };

  return (
    <PropertyRow label={label}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Typography variant="body2" fontWeight={600}>
          {formatCalcValue(data, calc.display)}
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          color="success"
          label={`stratum ${calc.stratum}`}
        />
        {calc.formula ? (
          <Chip size="small" variant="outlined" label={calc.formula} />
        ) : calc.aggregate ? (
          <Chip
            size="small"
            variant="outlined"
            label={`${calc.aggregate.type}(${calc.aggregate.over})`}
          />
        ) : null}
        <Tooltip title="Show fact-level provenance ($stmt)">
          <IconButton
            size="small"
            aria-label="provenance"
            onClick={openProvenance}
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </PropertyRow>
  );
}

export const computedFieldRendererEntry: DetailRendererRegistryEntry = {
  tester: rankWith(12, isCalcField),
  renderer: ComputedFieldRenderer,
};

/** Structural: property key ends with `$stmt` or items $ref StatementNode. */
const isStatementArrayControl: Tester = (uischema, schema) => {
  if (!isControl(uischema)) return false;
  const scope = (uischema as ControlElement).scope ?? "";
  if (
    scope.endsWith(STATEMENT_JSON_SUFFIX) ||
    scope.endsWith(STATEMENT_PERSISTENCE_SUFFIX)
  ) {
    return true;
  }
  const s = schema as JSONSchema7;
  if (s.type !== "array" || !s.items || Array.isArray(s.items)) return false;
  const items = s.items as JSONSchema7;
  if (items.$ref?.includes(STATEMENT_DEFINITION)) return true;
  if (items.properties?.wasGeneratedBy && items.properties?.value) return true;
  return false;
};

export function StatementArrayRenderer({ label, data }: DetailRendererProps) {
  const list = Array.isArray(data) ? data : [];
  if (list.length === 0) return null;

  const open = () => {
    calcDebug("open $stmt array", label, list);
    void showSchemaDrivenDetail({
      title: label || "Statements",
      data: { statements: list },
      schema: statementListSchema(),
    });
  };

  return (
    <PropertyRow label={label}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          size="small"
          color="info"
          label={`${list.length} statement${list.length === 1 ? "" : "s"}`}
          onClick={open}
        />
        <Tooltip title="Inspect statement metadata">
          <IconButton
            size="small"
            onClick={open}
            aria-label="inspect statements"
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </PropertyRow>
  );
}

export const statementArrayRendererEntry: DetailRendererRegistryEntry = {
  tester: rankWith(11, isStatementArrayControl),
  renderer: StatementArrayRenderer,
};
