import React, { useState } from "react";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import { Box } from "@mui/material";

import { shouldUseImagePlaceholder } from "../utils/imagePlaceholder";

type DetailHeroImageProps = {
  src: string | undefined;
  alt: string;
  sx?: Record<string, unknown>;
};

export function DetailHeroImage({ src, alt, sx }: DetailHeroImageProps) {
  const [failed, setFailed] = useState(false);
  const placeholder = shouldUseImagePlaceholder(failed, src);

  if (placeholder) {
    return (
      <Box
        className="graviola-detail-hero-image-placeholder"
        aria-hidden={!alt}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "action.hover",
          color: "text.disabled",
          ...sx,
        }}
      >
        <ImageNotSupportedOutlinedIcon
          sx={{ fontSize: "2.5rem", opacity: 0.55 }}
        />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      className="graviola-detail-hero-image"
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      sx={{
        width: "100%",
        display: "block",
        objectFit: "cover",
        ...sx,
      }}
    />
  );
}
