import { useThumbnailUrl } from "@graviola/edb-state-hooks";
import type { AssetKind } from "@graviola/edb-core-types";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import { Box, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { formatBytes } from "./assetUtils";

type AssetPreviewProps = {
  iri: string | undefined;
  kind: AssetKind;
  sizeCategory?: "card" | "listItem";
  fileName?: string;
  contentSize?: number;
  encodingFormat?: string;
};

export function AssetPreview({
  iri,
  kind,
  sizeCategory = "card",
  fileName,
  contentSize,
  encodingFormat,
}: AssetPreviewProps) {
  const thumbSize = sizeCategory === "listItem" ? "listItem" : "card";
  const showThumb =
    kind === "image" ||
    encodingFormat === "application/pdf" ||
    (encodingFormat?.startsWith("image/") ?? false);
  const thumbUrl = useThumbnailUrl(
    showThumb ? iri : undefined,
    showThumb ? { sizeCategory: thumbSize } : undefined,
  );
  const [imgFailed, setImgFailed] = useState(false);

  const onImgError = useCallback(() => setImgFailed(true), []);

  const height = sizeCategory === "listItem" ? 72 : 160;

  if (!iri) {
    return (
      <Box
        sx={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "action.hover",
          borderRadius: 1,
        }}
      >
        <ImageNotSupportedIcon color="disabled" />
      </Box>
    );
  }

  if (showThumb && thumbUrl && !imgFailed) {
    return (
      <Box
        component="img"
        src={thumbUrl}
        alt={fileName ?? iri}
        onError={onImgError}
        sx={{
          width: "100%",
          height,
          objectFit: "cover",
          borderRadius: 1,
          bgcolor: "action.hover",
        }}
      />
    );
  }

  const isPdf = encodingFormat === "application/pdf";
  const Icon = isPdf ? PictureAsPdfIcon : InsertDriveFileIcon;

  return (
    <Box
      sx={{
        height,
        px: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1,
        bgcolor: "action.hover",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <Icon color="action" />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap title={fileName}>
          {fileName ?? iri}
        </Typography>
        {contentSize !== undefined ? (
          <Typography variant="caption" color="text.secondary">
            {formatBytes(contentSize)}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
