import type {
  EntityPreview,
  PrimaryField,
  PrimaryFieldDeclaration,
  TypePresentation,
  TypePresentationRegistry,
} from "@graviola/edb-core-types";
import get from "lodash-es/get";

import { resolvePreviewDisplay } from "./resolvePreviewDisplay";

function readPrimaryString(
  data: unknown,
  fieldDecl: string | undefined,
): string | undefined {
  if (!fieldDecl || data == null) return undefined;
  if (typeof data !== "object") return undefined;
  const value = get(data as Record<string, unknown>, fieldDecl);
  return typeof value === "string" ? value : undefined;
}

function mergePreview(
  base: EntityPreview,
  patch: Partial<EntityPreview> | undefined,
): EntityPreview {
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    extras: { ...(base.extras ?? {}), ...(patch.extras ?? {}) },
  };
}

/**
 * Pure helper: resolve label/description/image from `primaryFields` and
 * icon/color/pattern from `typePresentation` for a typed object instance.
 */
export function extractEntityPreview(input: {
  data: unknown;
  typeName: string | undefined;
  typeIRI?: string;
  primaryFields?: PrimaryFieldDeclaration;
  typePresentation?: TypePresentationRegistry;
}): EntityPreview {
  const { data, typeName, typeIRI, primaryFields, typePresentation } = input;
  if (!typeName) return {};

  const pf: PrimaryField | undefined = primaryFields?.[typeName];
  const tp: TypePresentation | undefined = typePresentation?.[typeName];
  const fromOverride = tp?.override?.(data) ?? {};

  const preview: EntityPreview = {
    label: readPrimaryString(data, pf?.label),
    description: readPrimaryString(data, pf?.description),
    image: readPrimaryString(data, pf?.image),
    icon: tp?.icon,
    color: tp?.color,
    backgroundPattern: tp?.backgroundPattern,
    pluralLabel: tp?.pluralLabel,
  };

  const merged = mergePreview(preview, fromOverride);
  return resolvePreviewDisplay(merged, {
    data,
    typeName,
    typeIRI,
    typePresentation: tp,
  });
}
