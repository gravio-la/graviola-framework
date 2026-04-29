import { Box, Button, ButtonGroup, Skeleton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import {
  useAdbContext,
  useCRUDWithQueryClient,
  useTypeIRIFromEntity,
} from "@graviola/edb-state-hooks";
import { DetailRenderer } from "@graviola/edb-detail-renderer";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { useMemo } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { SchemaRouteOutletContext } from "../schemaOutletContext";
import { useEntityIRIFromEntityID } from "../useEntityIRIFromEntityID";
import type { JSONSchema7 } from "json-schema";
import { priceCentsRendererEntry } from "../detailRenderers/PriceCentsRenderer";

export function GenericDetailPage() {
  const { typeName, entityID } = useParams<{
    typeName: string;
    entityID: string;
  }>();
  const entityIRI = useEntityIRIFromEntityID(entityID);
  const { schemaConfig } = useOutletContext<SchemaRouteOutletContext>();
  const navigate = useNavigate();
  const basePath = `/${schemaConfig.schemaName}`;

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

  const detailUiSchema = useMemo(
    () =>
      resolvedTypeName
        ? schemaConfig.detailUiSchemata?.[resolvedTypeName]
        : undefined,
    [schemaConfig.detailUiSchemata, resolvedTypeName],
  );

  const typeSchema = useMemo<JSONSchema7 | undefined>(() => {
    if (!resolvedTypeName || !rootSchema) return undefined;
    return bringDefinitionToTop(
      rootSchema as any,
      resolvedTypeName,
    ) as JSONSchema7;
  }, [rootSchema, resolvedTypeName]);

  const humanLabel =
    schemaConfig.typeNameLabelMap[resolvedTypeName ?? ""] ?? resolvedTypeName;
  const extraDetailRenderers = useMemo(
    () =>
      schemaConfig.schemaName === "item-schema"
        ? [priceCentsRendererEntry]
        : [],
    [schemaConfig.schemaName],
  );

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
                navigate(`${basePath}/edit/${typeName}/${entityID}`)
              }
            >
              Bearbeiten
            </Button>
          </ButtonGroup>
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
        ) : typeSchema && data ? (
          <DetailRenderer
            schema={typeSchema}
            data={data}
            typeIRI={classIRI}
            typeName={resolvedTypeName}
            entityIRI={entityIRI}
            humanLabel={humanLabel}
            isLoading={isLoading}
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
