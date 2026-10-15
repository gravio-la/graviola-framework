import type { UploadedAsset } from "@graviola/edb-core-types";
import { ArrayLayoutProps, update } from "@jsonforms/core";
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import {
  Box,
  Button,
  FormHelperText,
  FormLabel,
  IconButton,
  LinearProgress,
  Stack,
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
  assetLinkedFieldValue,
  isTouchDevice,
  resolveAssetControlMeta,
} from "./assetUtils";
import { usePersistUploadedAsset } from "./usePersistUploadedAsset";
import { useAdbContext } from "@graviola/edb-state-hooks";

function normalizeArray(data: unknown): unknown[] {
  if (!Array.isArray(data)) return [];
  return data;
}

const AssetGalleryRendererComponent = (props: ArrayLayoutProps) => {
  const {
    visible,
    enabled,
    id,
    schema,
    rootSchema,
    config,
    data,
    path,
    errors,
    addItem,
    removeItems,
    uischema,
    label,
  } = props;
  const { t } = useTranslation();
  const ctx = useJsonForms();
  const dispatch = ctx?.dispatch;
  const { typeIRIToTypeName } = useAdbContext();
  const rootData = ctx?.core?.data;
  const parentEntityIRI =
    rootData && typeof rootData === "object"
      ? ((rootData as Record<string, unknown>)["@id"] as string | undefined)
      : undefined;

  const ctxConfig = ctx?.config as Record<string, unknown> | undefined;
  const meta = useMemo(
    () =>
      resolveAssetControlMeta(
        { schema, rootSchema, config, uischema },
        ctxConfig,
        typeIRIToTypeName,
      ),
    [
      schema,
      rootSchema,
      config,
      uischema,
      ctxConfig?.registry,
      ctxConfig?.assetClasses,
      typeIRIToTypeName,
    ],
  );

  const items = normalizeArray(data);
  const { persistUploaded, assetService } = usePersistUploadedAsset({
    typeIRI: meta.typeIRI,
    typeName: meta.typeName,
    classSchema: meta.classSchema,
  });
  const uploadsEnabled = Boolean(assetService?.enabled);
  const accept = acceptAttribute(meta.kind, assetService);

  const [inlineError, setInlineError] = useState<string | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [progressByName, setProgressByName] = useState<Record<string, number>>(
    {},
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appendLinked = useCallback(
    (iri: string, entity?: Record<string, unknown>) => {
      if (!meta.typeIRI) return;
      addItem(path, assetLinkedFieldValue(iri, meta.typeIRI, entity))();
    },
    [addItem, path, meta.typeIRI],
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!assetService?.enabled) return;
      setInlineError(null);
      const list = Array.from(files);
      for (const [index, file] of list.entries()) {
        const key = `${index}:${file.name}`;
        setProgressByName((p) => ({ ...p, [key]: 0 }));
        try {
          const asset = await assetService.upload(file, {
            onProgress: (f) => setProgressByName((p) => ({ ...p, [key]: f })),
          });
          const iri = await persistUploaded(asset);
          appendLinked(iri, {
            fileName: asset.fileName,
            encodingFormat: asset.encodingFormat,
            contentSize: asset.contentSize,
          });
        } catch (e) {
          setInlineError(assetErrorMessage(e));
        } finally {
          setProgressByName((p) => {
            const next = { ...p };
            delete next[key];
            return next;
          });
        }
      }
    },
    [assetService, persistUploaded, appendLinked],
  );

  const onFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) void uploadFiles(e.target.files);
      e.target.value = "";
    },
    [uploadFiles],
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      if (!enabled || !uploadsEnabled || !e.dataTransfer.files?.length) return;
      void uploadFiles(e.dataTransfer.files);
    },
    [enabled, uploadsEnabled, uploadFiles],
  );

  const removeAt = useCallback(
    (index: number) => {
      removeItems(path, [index])();
    },
    [removeItems, path],
  );

  const closeSourceDialog = useCallback(() => setSourceOpen(false), []);
  const onSourceDone = useCallback(() => undefined, []);
  const persistFromSource = useCallback(
    async (asset: UploadedAsset) => {
      const iri = await persistUploaded(asset);
      appendLinked(iri, {
        fileName: asset.fileName,
        encodingFormat: asset.encodingFormat,
        contentSize: asset.contentSize,
      });
    },
    [persistUploaded, appendLinked],
  );

  const move = useCallback(
    (index: number, delta: number) => {
      const target = index + delta;
      if (target < 0 || target >= items.length || !dispatch) return;
      dispatch(
        update(path, (current: unknown) => {
          const arr = Array.isArray(current) ? [...current] : [];
          const tmp = arr[index];
          arr[index] = arr[target];
          arr[target] = tmp;
          return arr;
        }),
      );
    },
    [items.length, dispatch, path],
  );

  if (!visible) return null;

  const progressEntries = Object.entries(progressByName);
  const fieldLabel =
    label ??
    (typeof schema.title === "string" && schema.title.length > 0
      ? schema.title
      : undefined);

  return (
    <Box id={id} sx={{ mb: 2 }}>
      {fieldLabel ? (
        <FormLabel sx={{ mb: 1, display: "block" }}>{fieldLabel}</FormLabel>
      ) : null}
      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
        {items.map((item, index) => {
          const iri = assetIriFromValue(item);
          return (
            <Box
              key={`${iri ?? index}-${index}`}
              sx={{
                width: 120,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                p: 0.5,
              }}
            >
              <AssetPreview
                iri={iri}
                kind={meta.kind}
                sizeCategory="listItem"
              />
              {enabled ? (
                <Stack direction="row" justifyContent="center">
                  <IconButton
                    size="small"
                    aria-label={t("Move left", "Move left")}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowBackIcon fontSize="inherit" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={t("Remove", "Remove")}
                    onClick={() => removeAt(index)}
                  >
                    <DeleteOutlineIcon fontSize="inherit" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={t("Move right", "Move right")}
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowForwardIcon fontSize="inherit" />
                  </IconButton>
                </Stack>
              ) : null}
            </Box>
          );
        })}
      </Stack>

      {uploadsEnabled && enabled ? (
        <>
          <Box
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: 2,
              borderStyle: "dashed",
              borderColor: "divider",
              borderRadius: 1,
              p: 2,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <CloudUploadIcon color="action" />
            <Typography variant="body2">
              {t("asset.dropOrClickMultiple", "Drop files or click to add")}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              size="small"
              startIcon={<LinkIcon />}
              onClick={() => setSourceOpen(true)}
            >
              {t("asset.fromSource", "From source / URL")}
            </Button>
          </Stack>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            accept={accept}
            capture={
              meta.kind === "image" && isTouchDevice()
                ? "environment"
                : undefined
            }
            onChange={onFileInput}
          />
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t("asset.uploadsDisabled", "Uploads are disabled for this project")}
        </Typography>
      )}

      {progressEntries.map(([name, frac]) => (
        <Box key={name} sx={{ mt: 1 }}>
          <Typography variant="caption">{name}</Typography>
          <LinearProgress variant="determinate" value={frac * 100} />
        </Box>
      ))}

      {inlineError || errors ? (
        <FormHelperText error>
          {inlineError ?? (typeof errors === "string" ? errors : "")}
        </FormHelperText>
      ) : null}

      {assetService && uploadsEnabled && sourceOpen ? (
        <AssetSourceDialog
          open
          onClose={closeSourceDialog}
          assetService={assetService}
          entityIRI={parentEntityIRI}
          typeName={meta.typeName}
          rootData={rootData}
          onDone={onSourceDone}
          persistUploaded={persistFromSource}
        />
      ) : null}
    </Box>
  );
};

export const AssetGalleryRenderer = withJsonFormsArrayLayoutProps(
  AssetGalleryRendererComponent,
);

export { AssetGalleryRendererComponent };
