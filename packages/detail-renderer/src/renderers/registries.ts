import { uiTypeIs, rankWith } from "@jsonforms/core";
import type { DetailRendererRegistryEntry } from "@graviola/edb-detail-renderer-core";

import {
  anyOfObjectUnionTester,
  arraynamedEntityTester,
  arrayInlineObjectTester,
  arrayPrimitiveTester,
  booleanTester,
  dateTester,
  dateTimeTester,
  namedEntityTester,
  enumTester,
  inlineObjectTester,
  numberTester,
  oneOfObjectUnionTester,
  stringTester,
  uriTester,
} from "@graviola/edb-detail-renderer-core";
import {
  AnyOfDetailRenderer,
  OneOfDetailRenderer,
} from "@graviola/edb-detail-renderer-core";

import { FallbackRenderer } from "./FallbackRenderer";
import { NumberRenderer } from "./NumberRenderer";
import { BooleanRenderer } from "./BooleanRenderer";
import { DateRenderer, DateTimeRenderer } from "./DateRenderer";
import { UriRenderer } from "./UriRenderer";
import { EnumRenderer } from "./EnumRenderer";
import { NamedEntityRenderer } from "./NamedEntityRenderer";
import { ArrayInlineObjectRenderer } from "./ArrayInlineObjectRenderer";
import { ArrayEntityRenderer } from "./ArrayEntityRenderer";
import { ArrayPrimitiveRenderer } from "./ArrayPrimitiveRenderer";
import { ObjectRenderer } from "./ObjectRenderer";
import { VerticalLayoutRenderer } from "./layouts/VerticalLayoutRenderer";
import { HorizontalLayoutRenderer } from "./layouts/HorizontalLayoutRenderer";
import { GroupRenderer } from "./layouts/GroupRenderer";
import { TopLevelLayoutRenderer } from "./layouts/TopLevelLayoutRenderer";
import { ChipLayoutRenderer } from "./layouts/ChipLayoutRenderer";
import { ListItemLayoutRenderer } from "./layouts/ListItemLayoutRenderer";
import { CardLayoutRenderer } from "./layouts/CardLayoutRenderer";
import { LabelRenderer } from "./layouts/LabelRenderer";

function buildRegistry(primaryLayout: {
  type: string;
  renderer: DetailRendererRegistryEntry["renderer"];
}): DetailRendererRegistryEntry[] {
  return [
    {
      tester: rankWith(16, uiTypeIs(primaryLayout.type)),
      renderer: primaryLayout.renderer,
    },
    {
      tester: rankWith(15, uiTypeIs("VerticalLayout")),
      renderer: VerticalLayoutRenderer,
    },
    {
      tester: rankWith(15, uiTypeIs("HorizontalLayout")),
      renderer: HorizontalLayoutRenderer,
    },
    { tester: rankWith(15, uiTypeIs("Group")), renderer: GroupRenderer },
    {
      tester: rankWith(15, uiTypeIs("TopLevelLayout")),
      renderer: TopLevelLayoutRenderer,
    },
    { tester: rankWith(14, uiTypeIs("Label")), renderer: LabelRenderer },
    { tester: anyOfObjectUnionTester, renderer: AnyOfDetailRenderer },
    { tester: oneOfObjectUnionTester, renderer: OneOfDetailRenderer },
    { tester: namedEntityTester, renderer: NamedEntityRenderer },
    { tester: arraynamedEntityTester, renderer: ArrayEntityRenderer },
    { tester: dateTester, renderer: DateRenderer },
    { tester: dateTimeTester, renderer: DateTimeRenderer },
    { tester: enumTester, renderer: EnumRenderer },
    { tester: arrayPrimitiveTester, renderer: ArrayPrimitiveRenderer },
    { tester: arrayInlineObjectTester, renderer: ArrayInlineObjectRenderer },
    { tester: booleanTester, renderer: BooleanRenderer },
    { tester: uriTester, renderer: UriRenderer },
    { tester: inlineObjectTester, renderer: ObjectRenderer },
    { tester: numberTester, renderer: NumberRenderer },
    { tester: stringTester, renderer: FallbackRenderer },
  ];
}

export const defaultDetailRenderers: DetailRendererRegistryEntry[] =
  buildRegistry({ type: "TopLevelLayout", renderer: TopLevelLayoutRenderer });

export const defaultChipRenderers = buildRegistry({
  type: "ChipLayout",
  renderer: ChipLayoutRenderer,
});

export const defaultListItemRenderers = buildRegistry({
  type: "ListItemLayout",
  renderer: ListItemLayoutRenderer,
});

export const defaultCardRenderers = buildRegistry({
  type: "CardLayout",
  renderer: CardLayoutRenderer,
});
