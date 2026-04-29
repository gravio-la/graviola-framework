import { uiTypeIs, rankWith } from "@jsonforms/core";
import type { DetailRendererRegistryEntry } from "@graviola/edb-detail-renderer-core";
import {
  anyOfObjectUnionTester,
  arrayEntityRefTester,
  arrayPrimitiveTester,
  booleanTester,
  dateTester,
  dateTimeTester,
  entityRefTester,
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
import { EntityRefRenderer } from "./EntityRefRenderer";
import { ArrayEntityRenderer } from "./ArrayEntityRenderer";
import { ArrayPrimitiveRenderer } from "./ArrayPrimitiveRenderer";
import { ObjectRenderer } from "./ObjectRenderer";
import { VerticalLayoutRenderer } from "./layouts/VerticalLayoutRenderer";
import { HorizontalLayoutRenderer } from "./layouts/HorizontalLayoutRenderer";
import { GroupRenderer } from "./layouts/GroupRenderer";
import { TopLevelLayoutRenderer } from "./layouts/TopLevelLayoutRenderer";
import { LabelRenderer } from "./layouts/LabelRenderer";

export const defaultDetailRenderers: DetailRendererRegistryEntry[] = [
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
  { tester: entityRefTester, renderer: EntityRefRenderer },
  { tester: arrayEntityRefTester, renderer: ArrayEntityRenderer },
  { tester: dateTester, renderer: DateRenderer },
  { tester: dateTimeTester, renderer: DateTimeRenderer },
  { tester: enumTester, renderer: EnumRenderer },
  { tester: arrayPrimitiveTester, renderer: ArrayPrimitiveRenderer },
  { tester: booleanTester, renderer: BooleanRenderer },
  { tester: uriTester, renderer: UriRenderer },
  { tester: inlineObjectTester, renderer: ObjectRenderer },
  { tester: numberTester, renderer: NumberRenderer },
  { tester: stringTester, renderer: FallbackRenderer },
];

export {
  FallbackRenderer,
  NumberRenderer,
  BooleanRenderer,
  DateRenderer,
  DateTimeRenderer,
  UriRenderer,
  EnumRenderer,
  EntityRefRenderer,
  ArrayEntityRenderer,
  ArrayPrimitiveRenderer,
  ObjectRenderer,
  VerticalLayoutRenderer,
  HorizontalLayoutRenderer,
  GroupRenderer,
  TopLevelLayoutRenderer,
  LabelRenderer,
};
export { PropertyRow } from "./PropertyRow";
