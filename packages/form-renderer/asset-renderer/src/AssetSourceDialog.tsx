import type {
  AssetCandidate,
  AssetService,
  UploadedAsset,
} from "@graviola/edb-core-types";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";
import { assetErrorMessage } from "./assetUtils";

type AssetSourceDialogProps = {
  open: boolean;
  onClose: () => void;
  assetService: AssetService;
  entityIRI?: string;
  typeName?: string;
  rootData?: unknown;
  onDone: () => void;
  persistUploaded: (asset: UploadedAsset) => Promise<void>;
};

export function AssetSourceDialog({
  open,
  onClose,
  assetService,
  entityIRI,
  typeName,
  rootData,
  onDone,
  persistUploaded,
}: AssetSourceDialogProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<AssetCandidate[]>([]);
  const [candidatesBusy, setCandidatesBusy] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setUrl("");
      setUrlError(null);
      setCandidateError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !assetService.candidates) {
      setCandidates([]);
      return;
    }
    let cancelled = false;
    setCandidatesBusy(true);
    setCandidateError(null);
    assetService
      .candidates({ entityIRI, typeName, data: rootData })
      .then((list) => {
        if (!cancelled) setCandidates(list);
      })
      .catch((e) => {
        if (!cancelled) setCandidateError(assetErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setCandidatesBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, assetService, entityIRI, typeName, rootData]);

  const finishImport = useCallback(
    async (run: () => Promise<UploadedAsset>) => {
      const asset = await run();
      await persistUploaded(asset);
      onDone();
      onClose();
    },
    [persistUploaded, onDone, onClose],
  );

  const handleUrlImport = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setUrlBusy(true);
    setUrlError(null);
    try {
      await finishImport(() => assetService.importFromUrl(trimmed));
    } catch (e) {
      setUrlError(assetErrorMessage(e));
    } finally {
      setUrlBusy(false);
    }
  }, [url, assetService, finishImport]);

  const handleCandidate = useCallback(
    async (candidate: AssetCandidate) => {
      setImportingId(candidate.id);
      setCandidateError(null);
      try {
        await finishImport(() => candidate.import());
      } catch (e) {
        setCandidateError(assetErrorMessage(e));
      } finally {
        setImportingId(null);
      }
    },
    [finishImport],
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("asset.fromSource", "From source / URL")}</DialogTitle>
      <DialogContent>
        <TextField
          label={t("asset.url", "URL")}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          fullWidth
          margin="normal"
          error={Boolean(urlError)}
          helperText={urlError ?? undefined}
        />
        {assetService.candidates ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t("asset.candidates", "Suggested sources")}
            </Typography>
            {candidatesBusy ? (
              <CircularProgress size={24} />
            ) : candidateError ? (
              <Typography color="error" variant="body2">
                {candidateError}
              </Typography>
            ) : (
              <Grid container spacing={1}>
                {candidates.map((c) => (
                  <Grid item xs={4} key={c.id}>
                    <Button
                      fullWidth
                      variant="outlined"
                      disabled={importingId === c.id}
                      onClick={() => handleCandidate(c)}
                      sx={{ p: 0, minHeight: 80 }}
                    >
                      <Box
                        component="img"
                        src={c.previewUrl}
                        alt={c.label ?? c.id}
                        sx={{
                          width: "100%",
                          height: 80,
                          objectFit: "cover",
                        }}
                      />
                    </Button>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel", "Cancel")}</Button>
        <Button
          variant="contained"
          disabled={urlBusy || !url.trim()}
          onClick={handleUrlImport}
        >
          {urlBusy ? <CircularProgress size={20} /> : t("Import", "Import")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
