import type {
  PrimaryFieldExtractDeclaration,
  TypePresentationRegistry,
} from "@graviola/edb-core-types";
import {
  extractEntityPreview,
  resolvePreviewDisplay,
} from "@graviola/edb-core-utils";
import type { TypePresentation } from "@graviola/edb-core-types";
import {
  applyToEachField,
  extractFieldIfString,
} from "@graviola/edb-data-mapping";
import { extractTypeIRI } from "@graviola/json-schema-utils";
import { useMemo } from "react";

import { useAdbContext } from "./provider/adbContext";

export function useEntityPreview(
  data: unknown,
  options?: { typeName?: string; typeIRI?: string },
): import("@graviola/edb-core-types").EntityPreview {
  const adb = useAdbContext();
  const { queryBuildOptions, typePresentation, typeIRIToTypeName } = adb;

  return useMemo(() => {
    const typeIRI =
      options?.typeIRI ??
      (data && typeof data === "object"
        ? extractTypeIRI(data as Record<string, unknown>)
        : undefined);
    const typeName =
      options?.typeName ?? (typeIRI ? typeIRIToTypeName(typeIRI) : undefined);

    if (!typeName) return {};

    const extracts =
      queryBuildOptions.primaryFieldExtracts as PrimaryFieldExtractDeclaration;
    const fieldDecl =
      extracts[typeName] ?? queryBuildOptions.primaryFields[typeName];

    const tp = (typePresentation as TypePresentationRegistry)?.[typeName] as
      | TypePresentation
      | undefined;

    if (
      data &&
      fieldDecl &&
      typeof fieldDecl === "object" &&
      "label" in fieldDecl
    ) {
      const hasExtractFn =
        typeof (fieldDecl as { label?: unknown }).label === "function" ||
        (fieldDecl.label &&
          typeof fieldDecl.label === "object" &&
          "path" in (fieldDecl.label as object));
      if (hasExtractFn || extracts[typeName]) {
        const { label, description, image } = applyToEachField(
          data,
          fieldDecl as Parameters<typeof applyToEachField>[1],
          extractFieldIfString,
        );
        const base = extractEntityPreview({
          data,
          typeName,
          typeIRI,
          primaryFields: queryBuildOptions.primaryFields,
          typePresentation: typePresentation as TypePresentationRegistry,
        });
        const merged = {
          ...base,
          ...(label ? { label } : {}),
          ...(description ? { description } : {}),
          ...(image ? { image } : {}),
        };
        return resolvePreviewDisplay(merged, {
          data,
          typeName,
          typeIRI,
          typePresentation: tp,
        });
      }
    }

    return extractEntityPreview({
      data,
      typeName,
      typeIRI,
      primaryFields: queryBuildOptions.primaryFields,
      typePresentation: typePresentation as TypePresentationRegistry,
    });
  }, [
    data,
    options?.typeIRI,
    options?.typeName,
    queryBuildOptions.primaryFields,
    queryBuildOptions.primaryFieldExtracts,
    typePresentation,
    typeIRIToTypeName,
  ]);
}

export function useTypePresentation(typeName: string | undefined) {
  const { typePresentation } = useAdbContext();
  return useMemo(
    () => (typeName ? typePresentation?.[typeName] : undefined),
    [typeName, typePresentation],
  );
}
