import type { Decorator } from "@storybook/react";

import { CardShowcaseShell } from "../../stories/_shared/CardShowcaseShell";

/** AdbProvider + motion adapter for M3 card showcase stories. */
export const withCardShowcaseProvider: Decorator = (Story) => (
  <CardShowcaseShell>
    <Story />
  </CardShowcaseShell>
);
