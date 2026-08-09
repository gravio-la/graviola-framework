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
import type {
  OverlayEntityStatus,
  OverlayStore,
  StagedChangeSet,
  StagedEntity,
} from "@graviola/edb-import-staging";
import { useCallback, useEffect, useState } from "react";
import { labelForEntity } from "./helpers";

type ImportReviewPanelProps = {
  changeSet: StagedChangeSet;
  overlay: OverlayStore;
  refreshKey: number;
  typeIRItoTypeName: IRIToStringFn;
  primaryFields: PrimaryFieldDeclaration;
  applyProgress: { done: number; total: number } | null;
  applying: boolean;
  onApplyAll: () => void;
  onDiscard: () => void;
};

const statusChipColor = (
  status: OverlayEntityStatus | undefined,
): "default" | "success" | "warning" | "info" => {
  switch (status) {
    case "new":
      return "success";
    case "augmented":
      return "warning";
    case "existing":
      return "info";
    default:
      return "default";
  }
};

const decisionChipColor = (
  decision: StagedEntity["trace"]["decision"],
): "default" | "success" | "warning" | "info" => {
  switch (decision) {
    case "created":
      return "success";
    case "matched-existing":
      return "info";
    case "augmented":
      return "warning";
    default:
      return "default";
  }
};

function MappingTreeNode({
  entity,
  changeSet,
  typeIRItoTypeName,
  primaryFields,
  depth,
}: {
  entity: StagedEntity;
  changeSet: StagedChangeSet;
  typeIRItoTypeName: IRIToStringFn;
  primaryFields: PrimaryFieldDeclaration;
  depth: number;
}) {
  const typeName = typeIRItoTypeName(entity.typeIRI);
  const label = labelForEntity(entity, typeIRItoTypeName, primaryFields);
  const trace = entity.trace;

  return (
    <>
      <ListItem sx={{ pl: 2 + depth * 2 }}>
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
              <Typography variant="body2" component="span">
                {label}
              </Typography>
              <Chip label={typeName} size="small" variant="outlined" />
              <Chip
                label={trace.decision}
                size="small"
                color={decisionChipColor(trace.decision)}
              />
              {trace.matchMethod ? (
                <Chip
                  label={trace.matchMethod}
                  size="small"
                  variant="outlined"
                />
              ) : null}
              <Chip
                label={`path:${trace.mappingPath.length}`}
                size="small"
                variant="outlined"
              />
            </Box>
          }
          secondary={trace.mappingPath.join(" → ") || entity.entityIRI}
        />
      </ListItem>
      {changeSet.childrenOf(entity.entityIRI).map((child) => (
        <MappingTreeNode
          key={child.entityIRI}
          entity={child}
          changeSet={changeSet}
          typeIRItoTypeName={typeIRItoTypeName}
          primaryFields={primaryFields}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

function RootCard({
  entity,
  changeSet,
  overlay,
  typeIRItoTypeName,
  primaryFields,
}: {
  entity: StagedEntity;
  changeSet: StagedChangeSet;
  overlay: OverlayStore;
  typeIRItoTypeName: IRIToStringFn;
  primaryFields: PrimaryFieldDeclaration;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overlayDoc, setOverlayDoc] = useState<Record<string, unknown> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const typeName = typeIRItoTypeName(entity.typeIRI);
  const label = labelForEntity(entity, typeIRItoTypeName, primaryFields);
  const childCount = changeSet.childrenOf(entity.entityIRI).length;
  const provenance = entity.provenance;

  const toggleExpand = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setLoading(true);
    try {
      const doc = await overlay.loadOne(typeName, entity.entityIRI);
      setOverlayDoc(doc);
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  }, [expanded, overlay, typeName, entity.entityIRI]);

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
            <Typography variant="subtitle1">{label}</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
              <Chip label={typeName} size="small" />
              <Chip
                label={`${provenance.method}${provenance.mappingId ? ` · ${provenance.mappingId}` : ""}`}
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
          {overlayDoc ? (
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
              {JSON.stringify(overlayDoc, null, 2)}
            </Box>
          ) : null}
        </Collapse>
      </CardContent>
    </Card>
  );
}

export function ImportReviewPanel({
  changeSet,
  overlay,
  refreshKey,
  typeIRItoTypeName,
  primaryFields,
  applyProgress,
  applying,
  onApplyAll,
  onDiscard,
}: ImportReviewPanelProps) {
  const [tab, setTab] = useState(0);
  const [reviewTick, setReviewTick] = useState(0);

  useEffect(() => {
    return changeSet.subscribe((ev) => {
      if (ev.kind === "review-changed" || ev.kind === "updated") {
        setReviewTick((n) => n + 1);
      }
    });
  }, [changeSet]);

  // refreshKey from parent (re-stage) + reviewTick (accept/reject) force list re-read
  void refreshKey;
  void reviewTick;

  const entities = changeSet.list();
  const roots = changeSet.roots();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6">Review staged import</Typography>

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
                changeSet={changeSet}
                overlay={overlay}
                typeIRItoTypeName={typeIRItoTypeName}
                primaryFields={primaryFields}
              />
            ))
          )}
        </Box>
      ) : null}

      {tab === 1 ? (
        <List dense sx={{ maxHeight: 360, overflow: "auto" }}>
          {entities.map((entity) => {
            const typeName = typeIRItoTypeName(entity.typeIRI);
            const label = labelForEntity(
              entity,
              typeIRItoTypeName,
              primaryFields,
            );
            const status = overlay.statusOf(entity.entityIRI);

            return (
              <ListItem
                key={entity.entityIRI}
                secondaryAction={
                  <ButtonGroup size="small" variant="outlined">
                    <Button
                      color={
                        entity.reviewState === "accepted"
                          ? "success"
                          : "inherit"
                      }
                      onClick={() =>
                        changeSet.setReviewState(entity.entityIRI, "accepted")
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
                        changeSet.setReviewState(entity.entityIRI, "rejected")
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
                      <Typography variant="body2">{label}</Typography>
                      <Chip label={typeName} size="small" variant="outlined" />
                      {status ? (
                        <Chip
                          label={status}
                          size="small"
                          color={statusChipColor(status)}
                        />
                      ) : null}
                      <Chip label={entity.reviewState} size="small" />
                    </Box>
                  }
                  secondary={entity.entityIRI}
                />
              </ListItem>
            );
          })}
        </List>
      ) : null}

      {tab === 2 ? (
        <List dense sx={{ maxHeight: 360, overflow: "auto" }}>
          {roots.length === 0 ? (
            <ListItem>
              <ListItemText primary="No mapping tree yet." />
            </ListItem>
          ) : (
            roots.map((root) => (
              <MappingTreeNode
                key={root.entityIRI}
                entity={root}
                changeSet={changeSet}
                typeIRItoTypeName={typeIRItoTypeName}
                primaryFields={primaryFields}
                depth={0}
              />
            ))
          )}
        </List>
      ) : null}

      {applyProgress ? (
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Applying {applyProgress.done} / {applyProgress.total}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={
              applyProgress.total > 0
                ? (applyProgress.done / applyProgress.total) * 100
                : 0
            }
          />
        </Box>
      ) : null}

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          onClick={onApplyAll}
          disabled={applying || entities.length === 0}
        >
          Apply all
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onDiscard}
          disabled={applying}
        >
          Discard
        </Button>
      </Box>
    </Box>
  );
}
