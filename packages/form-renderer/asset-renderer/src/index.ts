export {
  assetFieldTester,
  assetGalleryTester,
  ASSET_FIELD_TESTER_RANK,
  ASSET_GALLERY_TESTER_RANK,
} from "./assetTesters";
export { AssetFieldRenderer } from "./AssetFieldRenderer";
export { AssetGalleryRenderer } from "./AssetGalleryRenderer";
export {
  assetIriFromValue,
  assetLinkedFieldValue,
  assetErrorMessage,
} from "./assetUtils";

import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";
import { assetFieldTester, assetGalleryTester } from "./assetTesters";
import { AssetFieldRenderer } from "./AssetFieldRenderer";
import { AssetGalleryRenderer } from "./AssetGalleryRenderer";

export const assetRenderers: JsonFormsRendererRegistryEntry[] = [
  { tester: assetFieldTester, renderer: AssetFieldRenderer },
  { tester: assetGalleryTester, renderer: AssetGalleryRenderer },
];
