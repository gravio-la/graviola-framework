import { useCallback, useMemo, useState } from "react";
import { typeHasAuthorityMappings } from "@graviola/data-mapping-hooks";
import {
  mapByConfig,
  type DeclarativeMappings,
} from "@graviola/edb-data-mapping";
import {
  createOverlayStore,
  createStagedChangeSet,
  makeStagingStrategyContext,
  type OverlayStore,
  type StagedChangeSet,
} from "@graviola/edb-import-staging";
import {
  ImportReviewPanel,
  buildMainStoreProbe,
} from "@graviola/edb-import-components";
import { useAdbContext, useDataStore } from "@graviola/edb-state-hooks";
import {
  createWikidataKnowledgeBase,
  wikidataIriFromEntity,
  WIKIDATA_AUTHORITY,
} from "../authority/createWikidataKnowledgeBase";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import type { JSONSchema7 } from "json-schema";

export type ImportFromAuthorityButtonProps = {
  typeIRI: string;
  typeName: string;
  entityIRI: string;
  data?: Record<string, unknown> | null;
  onApplied?: (appliedIRIs: string[]) => void;
};

type Phase = "pick" | "review";

type SuggestHit = {
  id: string;
  key: string;
  title: string;
  description?: string;
};

/**
 * Mapping-aware entry to Wikidata staging dry-run (not primary-label finder).
 * Hidden when `normDataMapping` has no mapping for `typeName`.
 */
export function ImportFromAuthorityButton({
  typeIRI,
  typeName,
  entityIRI,
  data,
  onApplied,
}: ImportFromAuthorityButtonProps) {
  const {
    normDataMapping = {},
    authorityAccess,
    createEntityIRI,
    typeIRIToTypeName,
    typeNameToTypeIRI,
    schema,
    queryBuildOptions: { primaryFields, propertyToIRI },
  } = useAdbContext();
  const { dataStore } = useDataStore();

  const hasMapping = typeHasAuthorityMappings(
    normDataMapping as never,
    typeName,
  );

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("pick");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hits, setHits] = useState<SuggestHit[]>([]);
  const [changeSet, setChangeSet] = useState<StagedChangeSet | null>(null);
  const [overlay, setOverlay] = useState<OverlayStore | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [applying, setApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const suggestedWd = useMemo(
    () => wikidataIriFromEntity(data as { "@id"?: string; sameAs?: string }),
    [data],
  );

  const wikidataKb = useMemo(() => {
    const entry = normDataMapping[WIKIDATA_AUTHORITY];
    if (!entry?.sameAsTypeMap) return null;
    return createWikidataKnowledgeBase({
      sameAsTypeMap: entry.sameAsTypeMap,
    });
  }, [normDataMapping]);

  const reset = useCallback(() => {
    setPhase("pick");
    setError(null);
    setBusy(false);
    setHits([]);
    setSearch("");
    setChangeSet(null);
    setOverlay(null);
    setApplyProgress(null);
    setApplying(false);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const runStaging = useCallback(
    async (
      authorityEntityIRI: string,
      authorityRecord: Record<string, unknown>,
    ) => {
      if (!dataStore) {
        setError("Store not ready");
        return;
      }
      const mappingEntry = normDataMapping[WIKIDATA_AUTHORITY];
      const mappingTable = mappingEntry?.mapping as
        | Record<string, DeclarativeMappings>
        | undefined;
      const mappingConfig = mappingTable?.[typeName];
      if (!mappingConfig) {
        setError(`No Wikidata mapping for type ${typeName}`);
        return;
      }

      setBusy(true);
      setError(null);
      try {
        const cs = createStagedChangeSet({
          propertyToIRI: propertyToIRI ?? ((n: string) => n),
        });
        const rootIRI = entityIRI || createEntityIRI(typeName);

        // Staging strategies pass type IRIs; Adb `createEntityIRI` expects type names.
        const createEntityIRIFromTypeIRI = (typeIRIOrName: string) => {
          const name =
            typeIRIToTypeName(typeIRIOrName) ||
            typeIRIOrName.replace(/.*[#/]/, "") ||
            typeIRIOrName;
          return createEntityIRI(name);
        };

        const strategyContext = makeStagingStrategyContext({
          changeSet: cs,
          mainStore: buildMainStoreProbe(dataStore),
          mappingId: `wikidata/${typeName}`,
          sourceRef: authorityEntityIRI,
          rootIRI,
          createEntityIRI: createEntityIRIFromTypeIRI,
          typeIRItoTypeName: typeIRIToTypeName,
          primaryFields,
          authorityAccess,
          normDataMappings: normDataMapping as never,
        });

        const mapped = await mapByConfig(
          authorityRecord,
          {},
          mappingConfig,
          strategyContext,
        );

        await strategyContext.onNewDocument!({
          ...mapped,
          "@id": rootIRI,
          "@type": typeIRI,
          idAuthority: {
            authority: WIKIDATA_AUTHORITY,
            id: authorityEntityIRI,
          },
          sameAs: authorityEntityIRI,
        });

        const ov = createOverlayStore({
          changeSet: cs,
          mainStore: {
            loadOne: async (t, iri) => {
              const doc = await dataStore.loadOne(t, iri);
              return (doc as Record<string, unknown> | null) ?? null;
            },
          },
          schema: schema as JSONSchema7,
          typeIRItoTypeName: typeIRIToTypeName,
          typeNameToTypeIRI,
          defaultPrefix: typeNameToTypeIRI("City").replace(/City$/, ""),
          propertyToIRI,
        });

        setChangeSet(cs);
        setOverlay(ov);
        setRefreshKey((k) => k + 1);
        setPhase("review");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [
      authorityAccess,
      createEntityIRI,
      dataStore,
      entityIRI,
      normDataMapping,
      primaryFields,
      propertyToIRI,
      schema,
      typeIRI,
      typeIRIToTypeName,
      typeName,
      typeNameToTypeIRI,
    ],
  );

  const doSearch = useCallback(async () => {
    if (!wikidataKb || !search.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const results = await wikidataKb.find(search.trim(), typeIRI, typeName, {
        limit: 15,
      });
      setHits(results as SuggestHit[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [search, typeIRI, typeName, wikidataKb]);

  const acceptHit = useCallback(
    async (hit: SuggestHit) => {
      if (!wikidataKb?.getEntity) return;
      setBusy(true);
      try {
        const wdIri = `http://www.wikidata.org/entity/${hit.key}`;
        const record = (await wikidataKb.getEntity(wdIri)) as Record<
          string,
          unknown
        >;
        await runStaging(wdIri, record ?? {});
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setBusy(false);
      }
    },
    [runStaging, wikidataKb],
  );

  const importSuggested = useCallback(async () => {
    if (!suggestedWd || !wikidataKb?.getEntity) return;
    setBusy(true);
    try {
      const record = (await wikidataKb.getEntity(suggestedWd)) as Record<
        string,
        unknown
      >;
      await runStaging(suggestedWd, record ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }, [runStaging, suggestedWd, wikidataKb]);

  const handleApplyAll = useCallback(async () => {
    if (!changeSet || !dataStore) return;
    setApplying(true);
    setApplyProgress({ done: 0, total: changeSet.list().length });
    const unsub = changeSet.subscribe((ev) => {
      if (ev.kind === "apply-progress") {
        setApplyProgress({ done: ev.done, total: ev.total });
      }
    });
    try {
      const applied = await changeSet.applyAll(
        {
          upsert: async (tn, iri, document) => {
            await dataStore.upsert(tn, iri, document);
          },
        },
        typeIRIToTypeName,
      );
      onApplied?.(applied);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      unsub();
      setApplying(false);
    }
  }, [changeSet, close, dataStore, onApplied, typeIRIToTypeName]);

  if (!hasMapping) return null;

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CloudDownloadOutlinedIcon />}
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        Import from external sources
      </Button>
      <Dialog open={open} onClose={close} fullWidth maxWidth="md">
        <DialogTitle>
          {phase === "pick"
            ? `Import ${typeName} from Wikidata`
            : "Review staged import"}
        </DialogTitle>
        <DialogContent dividers>
          {error ? (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          ) : null}
          {busy ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : null}
          {phase === "pick" && !busy ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {suggestedWd ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Detected Wikidata link: <code>{suggestedWd}</code>
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => void importSuggested()}
                  >
                    Import this Wikidata entity
                  </Button>
                </Box>
              ) : null}
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  label="Search Wikidata"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void doSearch();
                  }}
                  fullWidth
                  size="small"
                />
                <Button variant="contained" onClick={() => void doSearch()}>
                  Search
                </Button>
              </Box>
              <List dense>
                {hits.map((hit) => (
                  <ListItemButton
                    key={hit.key}
                    onClick={() => void acceptHit(hit)}
                  >
                    <ListItemText
                      primary={hit.title}
                      secondary={hit.description ?? hit.key}
                    />
                  </ListItemButton>
                ))}
              </List>
              <Typography variant="caption" color="text.secondary">
                Accept a hit to run a recursive dry-run (review parents before
                writing to the store).
              </Typography>
            </Box>
          ) : null}
          {phase === "review" && changeSet && overlay && !busy ? (
            <ImportReviewPanel
              changeSet={changeSet}
              overlay={overlay}
              refreshKey={refreshKey}
              typeIRItoTypeName={typeIRIToTypeName}
              primaryFields={primaryFields}
              applyProgress={applyProgress}
              applying={applying}
              onApplyAll={() => void handleApplyAll()}
              onDiscard={() => {
                changeSet.discard();
                close();
              }}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
