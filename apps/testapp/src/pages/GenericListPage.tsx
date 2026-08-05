import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { SemanticTable } from "@graviola/edb-table-components";
import { useCallback } from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import type { SchemaRouteOutletContext } from "../schemaOutletContext";

const ITEM_SCHEMA = "item-schema";

/** REST has no SPARQL SELECT flat rows — default the table to Store/JSON-LD mode. */
const useRestStore =
  (import.meta.env.VITE_STORE as string | undefined)?.toLowerCase() === "rest";

export function GenericListPage() {
  const { typeName } = useParams<{ typeName: string }>();
  const { schemaConfig } = useOutletContext<SchemaRouteOutletContext>();
  const navigate = useNavigate();

  const basePath = `/${schemaConfig.schemaName}`;
  const rowShape = useRestStore ? "jsonld" : "sparql-select";

  const toEntitySegment = useCallback(
    (id: string) =>
      id.startsWith(schemaConfig.entityBaseIRI) &&
      id.length > schemaConfig.entityBaseIRI.length
        ? encodeURIComponent(id.slice(schemaConfig.entityBaseIRI.length))
        : encodeURIComponent(id),
    [schemaConfig.entityBaseIRI],
  );

  const onEditEntry = useCallback(
    (id: string, _typeIRI: string) => {
      navigate(`${basePath}/edit/${typeName}/${toEntitySegment(id)}`);
    },
    [basePath, navigate, toEntitySegment, typeName],
  );

  const onShowEntry = useCallback(
    (id: string, _typeIRI: string) => {
      navigate(`${basePath}/detail/${typeName}/${toEntitySegment(id)}`);
    },
    [basePath, navigate, toEntitySegment, typeName],
  );

  if (!typeName) {
    return <Typography color="error">Missing type name in route.</Typography>;
  }

  const showRowShapeToggle = schemaConfig.schemaName === ITEM_SCHEMA;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        alignSelf: "stretch",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {showRowShapeToggle ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            px: 1,
            pt: 1,
            flexShrink: 0,
          }}
        >
          <ToggleButtonGroup exclusive value={rowShape} size="small">
            <ToggleButton
              value="sparql-select"
              component={Link}
              to={`${basePath}/list/${typeName}`}
              disabled={useRestStore}
            >
              SPARQL SELECT
            </ToggleButton>
            <ToggleButton
              value="jsonld"
              component={Link}
              to={`${basePath}/list-jsonld/${typeName}`}
            >
              JSON-LD
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      ) : null}
      <SemanticTable
        typeName={typeName}
        rowShape={rowShape}
        tableUiSchema={schemaConfig.tableUiSchema}
        onEditEntry={onEditEntry}
        onShowEntry={onShowEntry}
      />
    </Box>
  );
}
