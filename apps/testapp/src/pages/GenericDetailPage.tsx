import { Box, Button, ButtonGroup, Skeleton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import {
  useAdbContext,
  useCRUDWithQueryClient,
  useTypeIRIFromEntity,
} from "@graviola/edb-state-hooks";
import {
  SemanticAnnotationsView,
  SemanticDetailView,
  SemanticDetailViewNoOps,
} from "@graviola/semantic-views";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { useComputedFields } from "@graviola/formula-runtime-react";
import {
  BROWSER_FORM_HOST,
  selectLiveEvalSlots,
} from "@graviola/formula-runtime";
import { useCallback, useMemo } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { SchemaRouteOutletContext } from "../schemaOutletContext";
import {
  CalcDebugToggle,
  documentForCalc,
  GardenFeeComputedPanel,
} from "../components/GardenFeeComputedPanel";
import { EntityMetaAffordances } from "../components/EntityMetaAffordances";
import { StratificationStoryPanel } from "../components/StratificationStoryPanel";
import { useEntityIRIFromEntityID } from "../useEntityIRIFromEntityID";
import type { JSONSchema7 } from "json-schema";
import { priceCentsRendererEntry } from "../detailRenderers/PriceCentsRenderer";
import {
  computedFieldRendererEntry,
  statementArrayRendererEntry,
} from "../detailRenderers/ComputedFieldRenderer";
import {
  gardenFeeCompiledProfile,
  gardenFeeExtendedSchema,
} from "../garden-fee-schema";
import { attachDemoStatements, demoEntityMeta } from "../demo/demoProvenance";
import { calcDebug } from "../demo/calcDebug";

function fingerprintInputs(
  source: Record<string, unknown> | undefined,
): string {
  const raw = JSON.stringify({
    fee: source?.fee_rate_per_sqm,
    vat: source?.vat_rate,
    patch: source?.patch,
  });
  let h = 0;
  for (let i = 0; i < raw.length; i++)
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function GenericDetailPage() {
  const { typeName, entityID } = useParams<{
    typeName: string;
    entityID: string;
  }>();
  const entityIRI = useEntityIRIFromEntityID(entityID);
  const { schemaConfig } = useOutletContext<SchemaRouteOutletContext>();
  const navigate = useNavigate();
  const basePath = `/${schemaConfig.schemaName}`;

  /** Same segment encoding as {@link GenericListPage} so `/` in IRIs does not break `:entityID`. */
  const toEntitySegment = useCallback(
    (id: string) =>
      id.startsWith(schemaConfig.entityBaseIRI) &&
      id.length > schemaConfig.entityBaseIRI.length
        ? encodeURIComponent(id.slice(schemaConfig.entityBaseIRI.length))
        : encodeURIComponent(id),
    [schemaConfig.entityBaseIRI],
  );

  const {
    typeNameToTypeIRI,
    typeIRIToTypeName,
    schema: rootSchema,
  } = useAdbContext();

  const typeIRI = useMemo(
    () => (typeName ? typeNameToTypeIRI(typeName) : undefined),
    [typeName, typeNameToTypeIRI],
  ) as string | undefined;

  const classIRI = useTypeIRIFromEntity(entityIRI ?? "", typeIRI);

  const resolvedTypeName = useMemo(
    () => typeIRIToTypeName(classIRI) ?? typeName,
    [classIRI, typeIRIToTypeName, typeName],
  );

  const {
    loadQuery: { data: rawData, isLoading },
  } = useCRUDWithQueryClient({
    entityIRI: entityIRI ?? "",
    typeIRI: classIRI,
    queryOptions: { enabled: Boolean(entityIRI) },
    loadQueryKey: "show",
  });

  const data = rawData?.document;

  const isGardenFee = schemaConfig.schemaName === "garden-fee";

  const calcSource = useMemo(
    () =>
      isGardenFee && resolvedTypeName
        ? documentForCalc(
            resolvedTypeName,
            data as Record<string, unknown> | undefined,
          )
        : undefined,
    [isGardenFee, resolvedTypeName, data],
  );

  const liveProfile = useMemo(
    () =>
      isGardenFee
        ? selectLiveEvalSlots(gardenFeeCompiledProfile, BROWSER_FORM_HOST)
        : undefined,
    [isGardenFee],
  );

  const { data: evaluated } = useComputedFields(liveProfile, calcSource);

  const displayData = useMemo(() => {
    if (!isGardenFee || !data) return data;
    const fingerprint = fingerprintInputs(calcSource);
    const withStmt = attachDemoStatements(
      evaluated as Record<string, unknown>,
      gardenFeeCompiledProfile,
      { inputFingerprint: fingerprint },
    );
    const merged = {
      ...withStmt,
      $meta:
        (data as { $meta?: unknown }).$meta ??
        demoEntityMeta(data as Record<string, unknown>),
    };
    calcDebug("detail displayData", {
      annual_fee: merged.annual_fee,
      annual_fee_gross: merged.annual_fee_gross,
      stmtKeys: Object.keys(merged).filter((k) => k.endsWith("$stmt")),
    });
    return merged;
  }, [isGardenFee, data, evaluated, calcSource]);

  const detailUiSchema = useMemo(
    () =>
      resolvedTypeName
        ? schemaConfig.detailUiSchemata?.[resolvedTypeName]
        : undefined,
    [schemaConfig.detailUiSchemata, resolvedTypeName],
  );

  const typeSchema = useMemo<JSONSchema7 | undefined>(() => {
    if (!resolvedTypeName) return undefined;
    const schemaForDetail = isGardenFee
      ? gardenFeeExtendedSchema
      : ((schemaConfig.extendedSchema as JSONSchema7 | undefined) ??
        (rootSchema as JSONSchema7 | undefined));
    if (!schemaForDetail) return undefined;
    return bringDefinitionToTop(
      schemaForDetail as never,
      resolvedTypeName,
    ) as JSONSchema7;
  }, [rootSchema, resolvedTypeName, isGardenFee, schemaConfig.extendedSchema]);

  const humanLabel =
    schemaConfig.typeNameLabelMap[resolvedTypeName ?? ""] ?? resolvedTypeName;
  const extraDetailRenderers = useMemo(() => {
    if (schemaConfig.schemaName === "item-schema") {
      return [priceCentsRendererEntry];
    }
    if (isGardenFee) {
      return [computedFieldRendererEntry, statementArrayRendererEntry];
    }
    return [];
  }, [schemaConfig.schemaName, isGardenFee]);

  if (!typeName || !entityIRI) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        Invalid detail route parameters.
      </Typography>
    );
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
      <Box sx={{ p: 2, maxWidth: 860, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <ButtonGroup variant="outlined" size="small">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`${basePath}/list/${typeName}`)}
            >
              {humanLabel}-Liste
            </Button>
            <Button
              startIcon={<EditIcon />}
              onClick={() =>
                navigate(
                  `${basePath}/edit/${typeName}/${toEntitySegment(entityIRI)}`,
                )
              }
            >
              Bearbeiten
            </Button>
          </ButtonGroup>
          {isGardenFee ? <CalcDebugToggle /> : null}
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={i === 1 ? 120 : 28}
              />
            ))}
          </Box>
        ) : typeSchema && displayData ? (
          <>
            {isGardenFee && schemaConfig.annotationMetaSchema ? (
              <>
                <StratificationStoryPanel
                  dense
                  highlightStratum={
                    resolvedTypeName === "Plot"
                      ? 1
                      : resolvedTypeName === "Patch"
                        ? 2
                        : undefined
                  }
                />
                <EntityMetaAffordances
                  document={displayData as Record<string, unknown>}
                  metaSchema={schemaConfig.annotationMetaSchema}
                />
              </>
            ) : null}
            {isGardenFee ? (
              <SemanticDetailViewNoOps
                data={displayData}
                schema={typeSchema}
                typeIRI={classIRI}
                typeName={resolvedTypeName}
                entityIRI={entityIRI}
                uiSchema={detailUiSchema}
                config={{
                  primaryFields: schemaConfig.primaryFields as Record<
                    string,
                    unknown
                  >,
                  extraRenderers: extraDetailRenderers,
                }}
              />
            ) : (
              <SemanticDetailView
                entityIRI={entityIRI}
                typeIRI={classIRI}
                typeName={resolvedTypeName}
                defaultData={displayData}
                disableLoad
                uiSchema={detailUiSchema}
                schema={typeSchema}
                config={{
                  primaryFields: schemaConfig.primaryFields as Record<
                    string,
                    unknown
                  >,
                  extraRenderers: extraDetailRenderers,
                }}
              />
            )}
            {isGardenFee ? (
              <GardenFeeComputedPanel
                typeName={resolvedTypeName!}
                document={data as Record<string, unknown>}
              />
            ) : null}
            {schemaConfig.metaStamping &&
            schemaConfig.annotationMetaSchema &&
            !isGardenFee ? (
              <SemanticAnnotationsView
                meta={(displayData as { $meta?: unknown })?.$meta}
                metaSchema={schemaConfig.annotationMetaSchema}
                uiSchema={
                  resolvedTypeName
                    ? schemaConfig.annotationDetailUiSchemata?.[
                        resolvedTypeName
                      ]
                    : undefined
                }
                title="Metadaten"
              />
            ) : null}
          </>
        ) : (
          !isLoading && (
            <Typography color="text.secondary">
              Keine Daten vorhanden.
            </Typography>
          )
        )}
      </Box>
    </Box>
  );
}
