import type { ValueRendererEntry } from "@graviola/edb-detail-renderer-core";
import {
  and,
  formatIs,
  imageUriTester,
  isBooleanControl,
  isControl,
  isNumberOrIntegerControl,
  isOneOfControl,
  isStringControl,
  rankWith,
} from "@graviola/edb-detail-renderer-core";

import { BooleanValueRenderer } from "./BooleanValueRenderer";
import { CurrencyValueRenderer } from "./CurrencyValueRenderer";
import { DateTimeValueRenderer, DateValueRenderer } from "./DateValueRenderer";
import { EnumValueRenderer } from "./EnumValueRenderer";
import { FallbackStringValueRenderer } from "./FallbackStringValueRenderer";
import { HistoricalDateValueRenderer } from "./HistoricalDateValueRenderer";
import { ImageValueRenderer } from "./ImageValueRenderer";
import { LocalizedNumberValueRenderer } from "./LocalizedNumberValueRenderer";
import { UriValueRenderer } from "./UriValueRenderer";

const nameOnlyTester = () => -1;

export const defaultValueRenderers: ValueRendererEntry[] = [
  {
    name: "currency",
    tester: nameOnlyTester,
    renderer: CurrencyValueRenderer,
  },
  {
    name: "historicalDate",
    tester: nameOnlyTester,
    renderer: HistoricalDateValueRenderer,
  },
  {
    name: "enum",
    tester: rankWith(8, and(isOneOfControl, isStringControl)),
    renderer: EnumValueRenderer,
  },
  {
    name: "dateTime",
    tester: rankWith(4, and(isControl, formatIs("date-time"))),
    renderer: DateTimeValueRenderer,
  },
  {
    name: "date",
    tester: rankWith(4, and(isControl, formatIs("date"))),
    renderer: DateValueRenderer,
  },
  {
    name: "image",
    tester: imageUriTester,
    renderer: ImageValueRenderer,
  },
  {
    name: "uri",
    tester: rankWith(3, and(isControl, formatIs("uri"))),
    renderer: UriValueRenderer,
  },
  {
    name: "boolean",
    tester: rankWith(3, isBooleanControl),
    renderer: BooleanValueRenderer,
  },
  {
    name: "number",
    tester: rankWith(2, and(isControl, isNumberOrIntegerControl)),
    renderer: LocalizedNumberValueRenderer,
  },
  {
    name: "string",
    tester: rankWith(1, isStringControl),
    renderer: FallbackStringValueRenderer,
  },
];
