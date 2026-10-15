import type { AssetService } from "@graviola/edb-core-types";

import { useAdbContext } from "./provider/adbContext";

/** Configured {@link AssetService} from `AdbProvider`, if any. */
export function useAssetService(): AssetService | undefined {
  const { assetService } = useAdbContext();
  return assetService;
}
