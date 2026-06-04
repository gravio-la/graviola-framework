import type {
  EntityPreview,
  IconRef,
  MimeIconMatchers,
  PreviewDisplayMedia,
  PreviewMediaContext,
  PreviewImageResolver,
  TypePresentation,
} from "@graviola/edb-core-types";
import get from "lodash-es/get";

function readStringAtPath(
  data: unknown,
  path: string | undefined,
): string | undefined {
  if (!path || data == null || typeof data !== "object") return undefined;
  const value = get(data as Record<string, unknown>, path);
  return typeof value === "string" ? value : undefined;
}

function resolveMimeIcon(
  matchers: MimeIconMatchers | undefined,
  mimeType: string | undefined,
  ctx: PreviewMediaContext,
): IconRef | undefined {
  if (!matchers || !mimeType) return undefined;
  if (typeof matchers === "function") {
    return matchers(mimeType, ctx);
  }
  if (matchers[mimeType]) return matchers[mimeType];
  const [major] = mimeType.split("/");
  if (major) {
    const wildcard = `${major}/*`;
    if (matchers[wildcard]) return matchers[wildcard];
  }
  return matchers["*/*"];
}

function isReactComponentType(value: unknown): boolean {
  if (typeof value === "function") return true;
  if (typeof value === "object" && value !== null) {
    return "$$typeof" in value || "render" in value || "type" in value;
  }
  return false;
}

function isIconRef(value: unknown): value is IconRef {
  if (value == null) return false;
  if (typeof value === "string") return value.length > 0;
  if (typeof value === "function") return true;
  return isReactComponentType(value);
}

function resolveImageUrl(
  tp: TypePresentation | undefined,
  ctx: PreviewMediaContext,
  instanceImage: string | undefined,
): string | undefined {
  const fromResolver = tp?.image?.(ctx);
  if (typeof fromResolver === "string" && fromResolver.length > 0) {
    return fromResolver;
  }
  return instanceImage;
}

/**
 * Apply chip/list display precedence: MIME icon → type icon → image → initial.
 */
export function resolvePreviewDisplay(
  preview: EntityPreview,
  input: {
    data: unknown;
    typeName: string;
    typeIRI?: string;
    typePresentation?: TypePresentation;
  },
): EntityPreview {
  const { data, typeName, typeIRI, typePresentation: tp } = input;
  const mimeType = readStringAtPath(data, tp?.mimeTypePath ?? "mimeType");
  const ctx: PreviewMediaContext = { data, typeName, typeIRI, mimeType };

  const mimeIcon = resolveMimeIcon(tp?.iconByMime, mimeType, ctx);
  const typeIcon = preview.icon ?? tp?.icon;
  const displayIcon = isIconRef(mimeIcon)
    ? mimeIcon
    : isIconRef(typeIcon)
      ? typeIcon
      : undefined;

  const imageUrl = resolveImageUrl(tp, ctx, preview.image);

  let displayMedia: PreviewDisplayMedia = "none";
  if (displayIcon) {
    displayMedia = "icon";
  } else if (imageUrl) {
    displayMedia = "image";
  } else if (preview.label && preview.label.length > 0) {
    displayMedia = "initial";
  }

  return {
    ...preview,
    displayMedia,
    displayIcon: displayIcon ?? undefined,
    displayImage: displayMedia === "image" ? imageUrl : undefined,
  };
}
