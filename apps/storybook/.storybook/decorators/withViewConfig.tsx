import React from "react";
import type { ViewConfigSet } from "@graviola/semantic-jsonform-types";
import { AdbProvider, useAdbContext } from "@graviola/edb-state-hooks";
import type { Decorator } from "@storybook/react";

function mergeViewConfig(
  base: ViewConfigSet | undefined,
  patch: ViewConfigSet,
): ViewConfigSet {
  const sizes = ["chip", "listItem", "card", "detail"] as const;
  const out: ViewConfigSet = { ...base };
  for (const size of sizes) {
    if (!patch[size]) continue;
    out[size] = {
      ...base?.[size],
      ...patch[size],
      options: {
        ...base?.[size]?.options,
        ...patch[size]?.options,
      },
    };
  }
  return out;
}

function ViewConfigLayer({
  viewConfig,
  children,
}: {
  viewConfig: ViewConfigSet;
  children: React.ReactNode;
}) {
  const parent = useAdbContext();
  return (
    <AdbProvider
      {...parent}
      viewConfig={mergeViewConfig(parent.viewConfig, viewConfig)}
    >
      {children}
    </AdbProvider>
  );
}

/** Merges `viewConfig` into the nearest parent {@link AdbProvider} (e.g. from `withSemanticViewsProvider`). */
export const withViewConfig =
  (viewConfig: ViewConfigSet): Decorator =>
  (Story) => (
    <ViewConfigLayer viewConfig={viewConfig}>
      <Story />
    </ViewConfigLayer>
  );
