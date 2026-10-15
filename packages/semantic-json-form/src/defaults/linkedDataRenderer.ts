import {
  RelationalFieldRenderer,
  relationalFieldRendererTester,
  materialArrayChipsLayoutTester,
  MaterialArrayOfLinkedItemChipsRenderer,
  MaterialArrayOfLinkedItemRenderer,
  MaterialArrayInlineObjectRenderer,
  materialArrayInlineObjectWithNestingTester,
  materialArrayOfLinkedItemTester,
  materialLinkedObjectControlTester,
  MaterialLinkedObjectRenderer,
} from "@graviola/edb-linked-data-renderer";
import {
  JsonFormsRendererRegistryEntry,
  rankWith,
  scopeEndsWith,
} from "@jsonforms/core";

export const graviolaRenderers: JsonFormsRendererRegistryEntry[] = [
  {
    tester: materialArrayChipsLayoutTester,
    renderer: MaterialArrayOfLinkedItemChipsRenderer,
  },
  // Dispatches between dropdown search and Entity Finder (explicit option >
  // user preference > app default). Replaces the separate inline (15) and
  // dropdown (20) registrations; their testers stay exported for compatibility.
  {
    tester: relationalFieldRendererTester,
    renderer: RelationalFieldRenderer,
  },
  {
    tester: materialLinkedObjectControlTester,
    renderer: MaterialLinkedObjectRenderer,
  },
  {
    tester: materialArrayOfLinkedItemTester,
    renderer: MaterialArrayOfLinkedItemRenderer,
  },
  {
    tester: materialArrayInlineObjectWithNestingTester,
    renderer: MaterialArrayInlineObjectRenderer,
  },
  {
    tester: rankWith(10, scopeEndsWith("@id")),
    renderer: () => null,
  },
  {
    tester: rankWith(10, scopeEndsWith("@type")),
    renderer: () => null,
  },
];
