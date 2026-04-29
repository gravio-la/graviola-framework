import {
  and,
  formatIs,
  isControl,
  isOneOfControl,
  isStringControl,
  rankWith,
} from "@jsonforms/core";
import type {
  ChipDefinition,
  ChipRendererEntry,
  ChipsConfig,
} from "@graviola/edb-detail-renderer-core";
import { isEntityRef } from "@graviola/edb-detail-renderer-core";
import { EntityChipRenderer } from "./renderers/EntityChipRenderer";
import { EnumChipRenderer } from "./renderers/EnumChipRenderer";
import { MediaChipRenderer, IMAGE_EXT_RE } from "./renderers/MediaChipRenderer";
import { PlayableChipRenderer } from "./renderers/PlayableChipRenderer";
import { SimpleLabelRenderer } from "./renderers/SimpleLabelRenderer";
import type { JSONSchema7 } from "json-schema";

const entityChipDefinition = (
  _schema: JSONSchema7,
  _data: unknown,
): ChipDefinition => ({
  label: (d) => {
    if (d == null || typeof d !== "object") return null;
    const rec = d as Record<string, unknown>;
    return typeof rec["@id"] === "string" ? rec["@id"] : null;
  },
});

const enumChipDefinition = (
  schema: JSONSchema7,
  data: unknown,
): ChipDefinition => ({
  label: (d) => {
    const s = schema as JSONSchema7;
    const match = s.oneOf?.find((e) => (e as JSONSchema7).const === d) as
      | JSONSchema7
      | undefined;
    return match?.title ?? String(d);
  },
  color: (d) => {
    const s = schema as JSONSchema7;
    const match = s.oneOf?.find((e) => (e as JSONSchema7).const === d) as any;
    return match?.["x-color"];
  },
});

const mediaChipDefinition = (
  _schema: JSONSchema7,
  data: unknown,
): ChipDefinition => ({
  label: (d) => {
    const s = typeof d === "string" ? d : null;
    if (!s) return null;
    return decodeURIComponent(s.substring(s.lastIndexOf("/") + 1, s.length));
  },
  image: (d) => (typeof d === "string" && IMAGE_EXT_RE.test(d) ? d : null),
});

const playableChipDefinition = (
  _schema: JSONSchema7,
  data: unknown,
): ChipDefinition => ({
  label: (d) => {
    const s = typeof d === "string" ? d : null;
    if (!s) return null;
    return decodeURIComponent(s.substring(s.lastIndexOf("/") + 1, s.length));
  },
});

const simpleChipDefinition = (
  _schema: JSONSchema7,
  data: unknown,
): ChipDefinition => ({
  label: (d) => (d == null ? null : String(d)),
});

export const defaultChipRegistry: ChipRendererEntry[] = [
  {
    tester: rankWith(5, isEntityRef),
    computeDefinition: entityChipDefinition,
    renderer: EntityChipRenderer,
  },
  {
    tester: rankWith(
      4,
      and(isControl, formatIs("uri"), (_uischema, _schema) => true),
    ),
    computeDefinition: playableChipDefinition,
    renderer: PlayableChipRenderer,
  },
  {
    tester: rankWith(4, and(isOneOfControl, isStringControl)),
    computeDefinition: enumChipDefinition,
    renderer: EnumChipRenderer,
  },
  {
    tester: rankWith(3, and(isControl, formatIs("uri"))),
    computeDefinition: mediaChipDefinition,
    renderer: MediaChipRenderer,
  },
  {
    tester: rankWith(1, isStringControl),
    computeDefinition: simpleChipDefinition,
    renderer: SimpleLabelRenderer,
  },
];

export const defaultChipsConfig: ChipsConfig = {
  registry: defaultChipRegistry,
};
