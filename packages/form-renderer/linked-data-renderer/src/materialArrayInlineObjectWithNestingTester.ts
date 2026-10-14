import {
  and,
  isObjectArrayWithNesting,
  not,
  RankedTester,
  rankWith,
} from "@jsonforms/core";

import { isArrayOfAnonymousObjectItems } from "./isArrayOfAnonymousObjectItems";
import { isArrayOfLinkedItems } from "./isArrayOfLinkedItems";

export const materialArrayInlineObjectWithNestingTester: RankedTester =
  rankWith(
    5,
    and(
      isObjectArrayWithNesting,
      isArrayOfAnonymousObjectItems,
      not(isArrayOfLinkedItems),
    ),
  );
