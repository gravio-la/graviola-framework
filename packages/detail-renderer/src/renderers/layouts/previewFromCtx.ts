import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";
import type { EntityPreview } from "@graviola/edb-core-types";

export function previewFromCtx(ctx: DetailTesterContext): EntityPreview {
  if (ctx.preview) return ctx.preview;
  const hp = ctx.headerPreview;
  if (!hp) return {};
  return {
    label: hp.label ?? undefined,
    description: hp.description ?? undefined,
    image: hp.image ?? undefined,
  };
}

export function motionScopeId(ctx: DetailTesterContext): string {
  return (
    ctx.entityIRI ??
    (ctx.preview?.label ? `label:${ctx.preview.label}` : "entity")
  );
}
