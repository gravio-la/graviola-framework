import React from "react";

import { storybookHref } from "./storybookHref";
import { StorybookLink } from "./StorybookLink";

type StorybookDocLinkProps = {
  storyId: string;
  hash?: string;
  children: React.ReactNode;
};

/** MDX-friendly anchor that uses Storybook `./?path=` routing. */
export function StorybookDocLink({
  storyId,
  hash,
  children,
}: StorybookDocLinkProps) {
  return (
    <StorybookLink href={storybookHref(storyId, hash)}>
      {children}
    </StorybookLink>
  );
}
