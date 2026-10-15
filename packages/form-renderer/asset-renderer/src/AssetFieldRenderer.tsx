import type { UploadedAsset } from "@graviola/edb-core-types";
import {
  useAdbContext,
  useCRUDWithQueryClient,
} from "@graviola/edb-state-hooks";
import { ControlProps } from "@jsonforms/core";
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { AssetPreview } from "./AssetPreview";
import { AssetSourceDialog } from "./AssetSourceDialog";
import {
  acceptAttribute,
  assetErrorMessage,
  assetIriFromValue,
  classHasCaption,
  isTouchDevice,
  resolveAssetControlMeta,
} from "./assetUtils";
import { usePersistUploadedAsset } from "./usePersistUploadedAsset";

const AssetFieldRendererComponent = (props: ControlProps) => {
  const {
    id,
    errors,
    schema,
    visible,
    enabled,
    config,
    data,
    handleChange,
    path,
    rootSchema,
  } = props;
  const { t } = useTranslation();
  const ctx = useJsonForms();
  const { typeIRIToTypeName } = useAdbContext();
  const rootData = ctx?.core?.data;
  const parentEntityIRI =
    rootData && typeof rootData === "object"
      ? ((rootData as Record<string, unknown>)["@id"] as string | undefined)
      : undefined;

  const meta = useMemo(
    () =>
      resolveAssetControlMeta(
        { schema, rootSchema, config },
        ctx?.config as Record<string, unknown> | undefined,
        typeIRIToTypeName,
      ),
    [schema, rootSchema, config, ctx?.config, typeIRIToTypeName],
  );

  const linkedIri = assetIriFromValue(data);
  const { persistUploaded, assetService } = usePersistUploadedAsset({
    typeIRI: meta.typeIRI,
    typeName: meta.typeName,
    classSchema: meta.classSchema,
  });

  const uploadsEnabled = Boolean(assetService?.enabled);
  const showCaption = classHasCaption(meta.classSchema);

  const {
    loadQuery: { data: loaded },
    saveMutation: captionSave,
  } = useCRUDWithQueryClient({
    entityIRI: linkedIri,
    typeIRI: meta.typeIRI,
    queryOptions: { enabled: Boolean(linkedIri && showCaption) },
  });

  const assetDoc = useMemo(() => {
    if (data && typeof data === "object" && Object.keys(data).length > 1) {
      return data as Record<string, unknown>;
    }
    return loaded?.document as Record<string, unknown> | undefined;
  }, [data, loaded]);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const linkAsset = useCallback(
    (iri: string) => {
      handleChange(path, iri);
    },
    [handleChange, path],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!assetService?.enabled) return;
      setInlineError(null);
      setUploadProgress(0);
      try {
        const asset = await assetService.upload(file, {
          onProgress: (f) => setUploadProgress(f),
        });
        const iri = await persistUploaded(asset);
        linkAsset(iri);
      } catch (e) {
        setInlineError(assetErrorMessage(e));
      } finally {
        setUploadProgress(null);
      }
    },
    [assetService, persistUploaded, linkAsset],
  );

  const onFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) void uploadFile(file);
    },
    [uploadFile],
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (!enabled || !uploadsEnabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) void uploadFile(file);
    },
    [enabled, uploadsEnabled, uploadFile],
  );

  const handleRemove = useCallback(() => {
    handleChange(path, undefined);
  }, [handleChange, path]);

  const handleOpenOriginal = useCallback(() => {
    if (!linkedIri || !assetService) return;
    const url = assetService.originalUrl(linkedIri);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }, [linkedIri, assetService]);

  const [captionDraft, setCaptionDraft] = useState("");
  const captionFromDoc =
    typeof assetDoc?.caption === "string" ? assetDoc.caption : "";
  const captionValue = captionDraft || captionFromDoc;

  const saveCaption = useCallback(async () => {
    if (!linkedIri || !meta.typeIRI || !assetDoc) return;
    const next = { ...assetDoc, caption: captionValue };
    await captionSave.mutateAsync(next);
    setCaptionDraft("");
  }, [linkedIri, meta.typeIRI, assetDoc, captionValue, captionSave]);

  const accept = acceptAttribute(meta.kind, assetService);

  if (!visible) return null;

  const helperText =
    inlineError ??
    (typeof errors === "string" && errors.length > 0 ? errors : undefined);

  return (
    <FormControl fullWidth id={id} sx={{ mb: 2 }}>
      {linkedIri ? (
        <Stack spacing={1}>
          <AssetPreview
            iri={linkedIri}
            kind={meta.kind}
            fileName={
              typeof assetDoc?.fileName === "string"
                ? assetDoc.fileName
                : undefined
            }
            contentSize={
              typeof assetDoc?.contentSize === "number"
                ? assetDoc.contentSize
                : undefined
            }
            encodingFormat={
              typeof assetDoc?.encodingFormat === "string"
                ? assetDoc.encodingFormat
                : undefined
            }
          />
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {uploadsEnabled && enabled ? (
              <>
                <Button
                  size="small"
                  startIcon={<SwapHorizIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t("asset.replace", "Replace")}
                </Button>
                <Button
                  size="small"
                  startIcon={<LinkIcon />}
                  onClick={() => setSourceOpen(true)}
                >
                  {t("asset.fromSource", "From source / URL")}
                </Button>
              </>
            ) : null}
            {assetService ? (
              <Button
                size="small"
                startIcon={<OpenInNewIcon />}
                onClick={handleOpenOriginal}
              >
                {t("asset.openOriginal", "Open original")}
              </Button>
            ) : null}
            {enabled ? (
              <IconButton
                size="small"
                aria-label={t("Remove", "Remove")}
                onClick={handleRemove}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Stack>
          {showCaption ? (
            <TextField
              size="small"
              label={t("asset.caption", "Caption")}
              value={captionValue}
              onChange={(e) => setCaptionDraft(e.target.value)}
              onBlur={() => void saveCaption()}
              disabled={!enabled}
            />
          ) : null}
        </Stack>
      ) : uploadsEnabled && enabled ? (
        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: 2,
            borderStyle: "dashed",
            borderColor: dragOver ? "primary.main" : "divider",
            borderRadius: 1,
            p: 3,
            textAlign: "center",
            cursor: "pointer",
            bgcolor: dragOver ? "action.hover" : undefined,
          }}
        >
          <CloudUploadIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="body2">
            {t("asset.dropOrClick", "Drop a file here or click to choose")}
          </Typography>
        </Box>
      ) : linkedIri ? (
        <Stack spacing={1}>
          <AssetPreview
            iri={linkedIri}
            kind={meta.kind}
            fileName={
              typeof assetDoc?.fileName === "string"
                ? assetDoc.fileName
                : undefined
            }
            contentSize={
              typeof assetDoc?.contentSize === "number"
                ? assetDoc.contentSize
                : undefined
            }
            encodingFormat={
              typeof assetDoc?.encodingFormat === "string"
                ? assetDoc.encodingFormat
                : undefined
            }
          />
          <Typography variant="body2" color="text.secondary">
            {t(
              "asset.uploadsDisabled",
              "Uploads are disabled for this project",
            )}
          </Typography>
          {enabled ? (
            <Button size="small" onClick={handleRemove}>
              {t("Clear", "Clear")}
            </Button>
          ) : null}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t("asset.uploadsDisabled", "Uploads are disabled for this project")}
        </Typography>
      )}

      {uploadProgress !== null ? (
        <Box sx={{ mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.round(uploadProgress * 100)}
          />
        </Box>
      ) : null}

      {!linkedIri && uploadsEnabled && enabled ? (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            size="small"
            startIcon={<LinkIcon />}
            onClick={() => setSourceOpen(true)}
          >
            {t("asset.fromSource", "From source / URL")}
          </Button>
        </Stack>
      ) : null}

      {uploadsEnabled && enabled ? (
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept={accept}
          capture={
            meta.kind === "image" && isTouchDevice() ? "environment" : undefined
          }
          onChange={onFileInput}
        />
      ) : null}

      {helperText ? (
        <FormHelperText error={Boolean(inlineError || errors?.length)}>
          {helperText}
        </FormHelperText>
      ) : null}

      {assetService && uploadsEnabled ? (
        <AssetSourceDialog
          open={sourceOpen}
          onClose={() => setSourceOpen(false)}
          assetService={assetService}
          entityIRI={parentEntityIRI}
          typeName={meta.typeName}
          rootData={rootData}
          onDone={() => undefined}
          persistUploaded={async (asset: UploadedAsset) => {
            const iri = await persistUploaded(asset);
            linkAsset(iri);
          }}
        />
      ) : null}
    </FormControl>
  );
};

export const AssetFieldRenderer = withJsonFormsControlProps(
  AssetFieldRendererComponent,
);

export { AssetFieldRendererComponent };
