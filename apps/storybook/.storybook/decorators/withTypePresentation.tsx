import React from "react";
import type { TypePresentationRegistry } from "@graviola/edb-core-types";
import { AdbProvider, useAdbContext } from "@graviola/edb-state-hooks";
import type { Decorator } from "@storybook/react";

function TypePresentationLayer({
  typePresentation,
  children,
}: {
  typePresentation: TypePresentationRegistry;
  children: React.ReactNode;
}) {
  const parent = useAdbContext();
  return (
    <AdbProvider {...parent} typePresentation={typePresentation}>
      {children}
    </AdbProvider>
  );
}

/** Replaces `typePresentation` on the nearest parent {@link AdbProvider}. */
export const withTypePresentation =
  (typePresentation: TypePresentationRegistry): Decorator =>
  (Story) => (
    <TypePresentationLayer typePresentation={typePresentation}>
      <Story />
    </TypePresentationLayer>
  );
