/** UI presentation vocabulary. Pure types, no React dependency (icons are typed structurally). Candidate for extraction into its own package; see apps/package-graph/reviews/plans/core-types-presentation-split.md. */

import type { EntityActionDef } from "./entityActions";

/** M3 card surface variant. */
export type CardVariant = "elevated" | "filled" | "outlined";

/** Card layout orientation — vertical (media top) or horizontal (media side). */
export type CardOrientation = "vertical" | "horizontal";

/** Density / padding scale for cards in grids vs. lists. */
export type CardSize = "compact" | "standard" | "comfortable";

/** Listing density for chip / listItem / card surfaces. */
export type ViewDensity = "condensed" | "extended";

/** How secondary (non-primary) leaf properties are laid out on a card. */
export type CardSecondaryDisplay = "inline" | "stats";

/**
 * Per-type card presentation — parallel to {@link PrimaryField} for hero slots.
 * Configured on `AdbProvider.cardPresentation` or `viewConfig.card.options`.
 */
export interface CardPresentation {
  /** Explicit secondary property names (leaf literals). */
  secondaryFields?: string[];
  /** Max secondary fields when inferring from schema (default 3). */
  secondaryFieldLimit?: number;
  secondaryDisplay?: CardSecondaryDisplay;
  actions?: EntityActionDef[];
  variant?: CardVariant;
  orientation?: CardOrientation;
  size?: CardSize;
  /** Reveal secondary fields in-place via expand affordance (not detail modal). */
  expandable?: boolean;
  /** CSS aspect-ratio for hero media (default `16 / 9`). */
  mediaAspectRatio?: string;
  /** Overlay headline/subhead on hero media with gradient scrim. */
  mediaOverlay?: boolean;
  /** Property name for a banner/header image (profile-card pattern). */
  banner?: string;
  /** Hide labels on secondary property rows for a cleaner card body. */
  hidePropertyLabels?: boolean;
}

export type CardPresentationRegistry = Record<string, CardPresentation>;

/** Props passed to app-supplied icon components (MUI SvgIcon, @mui/icons-material, etc.). */
export type PreviewIconProps = {
  fontSize?: number | string;
  color?: string;
  className?: string;
};

/**
 * React component (incl. MUI forwardRef/memo / OverridableComponent),
 * render function, or plain object component.
 *
 * MUI `@mui/icons-material` icons are `OverridableComponent`s whose call
 * overloads are not assignable to `(props: PreviewIconProps) => unknown`.
 * They are accepted via the structural arms (`muiName` / `$$typeof`).
 */
export type IconComponentLike =
  | ((props: PreviewIconProps) => unknown)
  | Record<string, unknown>
  | { readonly muiName: string }
  | { readonly $$typeof: unknown };

/**
 * Type-level or MIME-level icon: emoji/label string, component, render fn, or
 * resolver evaluated per entity instance.
 */
export type IconRef = string | IconComponentLike | PreviewIconResolver;

/** Resolve an icon from instance `data` (e.g. pick MIME-specific icon). */
export type PreviewIconResolver = (
  ctx: PreviewMediaContext,
) => IconRef | undefined;

/**
 * Optional per-instance image URL (thumbnail service, derived URL, base64).
 * For size-aware display rewriting, use {@link ResolveThumbnailUrl} on GlobalAppConfig.
 */
export type PreviewImageResolver = (
  ctx: PreviewMediaContext,
) => string | undefined;

export type PreviewMediaContext = {
  data: unknown;
  typeName: string;
  typeIRI?: string;
  mimeType?: string;
};

/** Aligns with ViewSize. Call sites almost always pass only `sizeCategory`. */
export type ThumbnailSizeCategory = "chip" | "listItem" | "card" | "detail";

/** Named 2D size; either side optional (e.g. width-only thumbs). */
export type Size2D = Partial<{ width: number; height: number }>;

/**
 * Desired thumbnail geometry. If every field is omitted / size arg is omitted,
 * the framework treats it as `{ sizeCategory: "detail" }`.
 */
export type ThumbnailSizeOptions = {
  /** Exact pixel box (width and/or height). */
  dimension?: Size2D;
  /** Desired aspect ratio as named sides (e.g. `{ width: 16, height: 9 }`). */
  aspect?: Size2D;
  /** Named slot; preferred for chips, lists, cards, detail heroes. */
  sizeCategory?: ThumbnailSizeCategory;
};

/** Entity/view metadata for {@link ResolveThumbnailUrl}; size lives on the size arg only. */
export type ThumbnailResolveContext = {
  viewSize?: ThumbnailSizeCategory;
  typeName?: string;
  typeIRI?: string;
  entityIRI?: string;
  data?: unknown;
};

/**
 * App-supplied display-time image URL rewrite (CDN / Commons / proxy).
 * Return `undefined` to keep the original URL.
 */
export type ResolveThumbnailUrl = (
  imageUrl: string,
  size: ThumbnailSizeOptions,
  context?: ThumbnailResolveContext,
) => string | undefined;

export type MimeIconMatcherMap = Record<string, IconRef>;
export type MimeIconMatcherFn = (
  mimeType: string,
  ctx: PreviewMediaContext,
) => IconRef | undefined;
export type MimeIconMatchers = MimeIconMatcherMap | MimeIconMatcherFn;

export interface TypePresentation {
  /** Default icon for this type (all instances unless MIME rule matches). */
  icon?: IconRef;
  /**
   * Same-type shape variants (e.g. files): map MIME type → icon, or a matcher fn.
   * Keys may be exact (`image/png`) or major (`image/*`).
   */
  iconByMime?: MimeIconMatchers;
  /** Dot-path on instance data for MIME type; default `mimeType`. */
  mimeTypePath?: string;
  /**
   * App-provided image URL when instance primary field is not used.
   * Size-aware CDN rewrite belongs on GlobalAppConfig.resolveThumbnailUrl.
   */
  image?: PreviewImageResolver;
  color?: string;
  backgroundPattern?: string;
  pluralLabel?: string;
  /** Shallow-merged on top of registry defaults after instance fields are read. */
  override?: (data: unknown) => Partial<EntityPreview>;
}

export type TypePresentationRegistry = Record<string, TypePresentation>;

export type PreviewDisplayMedia = "image" | "icon" | "initial" | "none";

/** Combined label/description/image (instance) + icon/color (type-level). */
export interface EntityPreview {
  label?: string;
  description?: string;
  /** Raw instance image from `primaryFields` or override (may not be shown if icon wins). */
  image?: string;
  /** Type-level icon ref before display precedence is applied. */
  icon?: IconRef;
  color?: string;
  backgroundPattern?: string;
  pluralLabel?: string;
  extras?: Record<string, unknown>;
  /**
   * Resolved chip/list avatar slot after precedence:
   * MIME icon → type icon → explicit image → initial letter → none.
   */
  displayMedia?: PreviewDisplayMedia;
  displayImage?: string;
  displayIcon?: IconRef;
}
