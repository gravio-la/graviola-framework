import type { FacetRendererEntry } from "../registry";
import { BooleanFacet, booleanTester } from "./BooleanFacet";
import { DateRangeFacet, dateRangeTester } from "./DateRangeFacet";
import { MimeTypeFacet, mimeTypeTester } from "./MimeTypeFacet";
import { RangeFacet, rangeTester } from "./RangeFacet";
import { TermsChipsFacet, termsChipsTester } from "./TermsChipsFacet";
import { TermsListFacet, termsListTester } from "./TermsListFacet";

export const defaultFacetRenderers: FacetRendererEntry[] = [
  { tester: mimeTypeTester, Component: MimeTypeFacet },
  { tester: dateRangeTester, Component: DateRangeFacet },
  { tester: booleanTester, Component: BooleanFacet },
  { tester: rangeTester, Component: RangeFacet },
  { tester: termsListTester, Component: TermsListFacet },
  { tester: termsChipsTester, Component: TermsChipsFacet },
];
