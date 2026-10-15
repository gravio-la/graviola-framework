import { beforeAll, describe, expect, mock, test } from "bun:test";
import { Window } from "happy-dom";
import { act, render } from "@testing-library/react";
import React, { useEffect, useMemo, useState } from "react";
import type { AssetService } from "@graviola/edb-core-types";

import { AssetSourceDialog } from "./AssetSourceDialog";

mock.module("next-i18next", () => ({
  useTranslation: () => ({
    t: (_k: string, d?: string) => d ?? _k,
  }),
}));

const assetService: AssetService = {
  enabled: true,
  isAssetRef: () => false,
  assetIdOf: () => undefined,
  thumbnailUrl: () => undefined,
  originalUrl: () => undefined,
  upload: mock(async () => {
    throw new Error("not used");
  }),
  importFromUrl: mock(async () => {
    throw new Error("not used");
  }),
  iriFor: () => "http://example.org/asset/x",
  candidates: mock(async () => []),
};

let dialogRenderCount = 0;

function CountingDialog(props: React.ComponentProps<typeof AssetSourceDialog>) {
  dialogRenderCount += 1;
  return <AssetSourceDialog {...props} />;
}

describe("AssetSourceDialog", () => {
  beforeAll(() => {
    const win = new Window();
    // @ts-expect-error happy-dom globals
    globalThis.window = win;
    // @ts-expect-error happy-dom globals
    globalThis.document = win.document;
  });

  test("closed dialog does not re-render on rootData identity churn", async () => {
    dialogRenderCount = 0;

    function Parent() {
      const [n, setN] = useState(0);
      useEffect(() => {
        let ticks = 0;
        const id = setInterval(() => {
          ticks += 1;
          setN(ticks);
          if (ticks >= 12) clearInterval(id);
        }, 10);
        return () => clearInterval(id);
      }, []);
      const rootData = useMemo(
        () => ({ "@id": "http://example.org/e/1", n }),
        [n],
      );
      return (
        <CountingDialog
          open={false}
          onClose={() => undefined}
          assetService={assetService}
          entityIRI="http://example.org/e/1"
          typeName="Fundstueck"
          rootData={rootData}
          onDone={() => undefined}
          persistUploaded={async () => undefined}
        />
      );
    }

    render(<Parent />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    expect(dialogRenderCount).toBeLessThanOrEqual(5);
    expect(assetService.candidates).not.toHaveBeenCalled();
  });
});
