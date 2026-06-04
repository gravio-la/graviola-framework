import React, { useMemo } from "react";
import { Chip } from "@mui/material";
import type { ContainedEntityComponentProps } from "@graviola/edb-detail-renderer";
import {
  previewChipAvatar,
  previewChipIcon,
} from "@graviola/edb-detail-renderer";
import { useAdbContext, useEntityPreview } from "@graviola/edb-state-hooks";

/**
 * Nested entity chip for detail views: uses embedded data (no store load) and
 * honors {@link ContainedEntityComponentProps.onClick} for named nodes.
 */
export function ContainedSemanticChip({
  data,
  typeIRI,
  entityIRI,
  onClick,
}: ContainedEntityComponentProps) {
  const adb = useAdbContext();
  const typeName = useMemo(
    () => (typeIRI ? adb.typeIRIToTypeName(typeIRI) : undefined),
    [typeIRI, adb.typeIRIToTypeName],
  );
  const preview = useEntityPreview(data, { typeIRI, typeName });
  const label =
    preview.label ??
    (data &&
    typeof data === "object" &&
    typeof (data as { name?: string }).name === "string"
      ? (data as { name: string }).name
      : (entityIRI ?? ""));

  const chipIcon = previewChipIcon(preview);
  const chipAvatar = previewChipAvatar(preview, label);

  return (
    <Chip
      size="small"
      onClick={onClick}
      clickable={Boolean(onClick)}
      icon={chipIcon as React.ReactElement | undefined}
      avatar={chipAvatar}
      label={label}
    />
  );
}
