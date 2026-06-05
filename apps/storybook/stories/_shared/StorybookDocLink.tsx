import React from "react";

import { storybookHref } from "./storybookHref";

type StorybookDocLinkProps = {
  storyId: string;
  hash?: string;
  children: React.ReactNode;
};

/** MDX-friendly anchor that uses Storybook `?path=` routing. */
export function StorybookDocLink({
  storyId,
  hash,
  children,
}: StorybookDocLinkProps) {
  return <a href={storybookHref(storyId, hash)}>{children}</a>;
}
