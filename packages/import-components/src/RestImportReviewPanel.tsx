import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  Collapse,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type { IRIToStringFn } from "@graviola/edb-core-types";
import { useCallback, useMemo, useState } from "react";
import type { StagedEntitySummary } from "./importSessionClient";
import { getStagedEntity, setStagedReviewState } from "./importSessionClient";

type RestImportReviewPanelProps = {
  sessionId: string;
  sessionIRI: string;
  entities: StagedEntitySummary[];
  tree: string;
  typeIRItoTypeName: IRIToStringFn;
  primaryFields: PrimaryFieldDeclaration;
  applying: boolean;
  onApplyAll: () => void;
  onDiscard: () => void;
  onReviewChanged: () => void;
};

function childrenOf(
  entities: StagedEntitySummary[],
  parentIRI: string,
): StagedEntitySummary[] {
  return entities.filter((e) => e.parentIRI === parentIRI);
}

function RootCard({
  entity,
  sessionId,
  entities,
}: {
  entity: StagedEntitySummary;
  sessionId: string;
  entities: StagedEntitySummary[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [document, setDocument] = useState<Record<string, unknown> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const childCount = childrenOf(entities, entity.entityIRI).length;

  const toggleExpand = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setLoading(true);
    try {
      const full = await getStagedEntity(sessionId, entity.entityIRI);
      setDocument(full.document);
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  }, [expanded, sessionId, entity.entityIRI]);

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1">{entity.label}</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
              <Chip label={entity.typeName} size="small" />
              <Chip
                label={`${entity.provenance.method}${entity.provenance.mappingId ? ` · ${entity.provenance.mappingId}` : ""}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${childCount} children`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
          <Button
            size="small"
            onClick={() => void toggleExpand()}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            disabled={loading}
          >
            {loading ? "Loading…" : expanded ? "Hide" : "Details"}
          </Button>
        </Box>
        <Collapse in={expanded}>
          {document ? (
            <Box
              component="pre"
              sx={{
                mt: 1,
                p: 1,
                bgcolor: "action.hover",
                borderRadius: 1,
                fontSize: "0.75rem",
                overflow: "auto",
                maxHeight: 240,
              }}
            >
              {JSON.stringify(document, null, 2)}
            </Box>
          ) : null}
        </Collapse>
      </CardContent>
    </Card>
  );
}

export function RestImportReviewPanel({
  sessionId,
  sessionIRI,
  entities,
  tree,
  typeIRItoTypeName,
  primaryFields,
  applying,
  onApplyAll,
  onDiscard,
  onReviewChanged,
}: RestImportReviewPanelProps) {
  const [tab, setTab] = useState(0);
  void typeIRItoTypeName;
  void primaryFields;

  const roots = useMemo(
    () => entities.filter((e) => e.parentIRI === undefined),
    [entities],
  );

  const handleReview = useCallback(
    async (
      entityIRI: string,
      reviewState: StagedEntitySummary["reviewState"],
    ) => {
      await setStagedReviewState(sessionId, entityIRI, reviewState);
      onReviewChanged();
    },
    [sessionId, onReviewChanged],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6">
        Review staged import (server session)
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Session {sessionIRI} · {entities.length} entities staged on the API
      </Typography>

      <Tabs value={tab} onChange={(_, value: number) => setTab(value)}>
        <Tab label={`Roots (${roots.length})`} />
        <Tab label={`New entities (${entities.length})`} />
        <Tab label="Mapping tree" />
      </Tabs>

      {tab === 0 ? (
        <Box>
          {roots.length === 0 ? (
            <Typography color="text.secondary">
              No root entities staged.
            </Typography>
          ) : (
            roots.map((root) => (
              <RootCard
                key={root.entityIRI}
                entity={root}
                sessionId={sessionId}
                entities={entities}
              />
            ))
          )}
        </Box>
      ) : null}

      {tab === 1 ? (
        <List dense sx={{ maxHeight: 360, overflow: "auto" }}>
          {entities.map((entity) => (
            <ListItem
              key={entity.entityIRI}
              secondaryAction={
                <ButtonGroup size="small" variant="outlined">
                  <Button
                    color={
                      entity.reviewState === "accepted" ? "success" : "inherit"
                    }
                    onClick={() =>
                      void handleReview(entity.entityIRI, "accepted")
                    }
                    startIcon={<CheckIcon />}
                  >
                    Accept
                  </Button>
                  <Button
                    color={
                      entity.reviewState === "rejected" ? "error" : "inherit"
                    }
                    onClick={() =>
                      void handleReview(entity.entityIRI, "rejected")
                    }
                    startIcon={<CloseIcon />}
                  >
                    Reject
                  </Button>
                </ButtonGroup>
              }
            >
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2">{entity.label}</Typography>
                    <Chip
                      label={entity.typeName}
                      size="small"
                      variant="outlined"
                    />
                    <Chip label={entity.reviewState} size="small" />
                  </Box>
                }
                secondary={entity.entityIRI}
              />
            </ListItem>
          ))}
        </List>
      ) : null}

      {tab === 2 ? (
        tree ? (
          <Box
            component="pre"
            sx={{
              p: 1,
              bgcolor: "action.hover",
              borderRadius: 1,
              fontSize: "0.75rem",
              overflow: "auto",
              maxHeight: 360,
            }}
          >
            {tree}
          </Box>
        ) : (
          <Typography color="text.secondary">No mapping tree yet.</Typography>
        )
      ) : null}

      {applying ? <LinearProgress /> : null}

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          onClick={onApplyAll}
          disabled={applying || entities.length === 0}
        >
          Apply all (server → Postgres)
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onDiscard}
          disabled={applying}
        >
          Discard session
        </Button>
      </Box>
    </Box>
  );
}
