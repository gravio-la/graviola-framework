import type { MotionAdapter } from "@graviola/semantic-views";
import { MotionAdapterProvider } from "@graviola/semantic-views";
import type { Decorator } from "@storybook/react";

export const withMotionAdapter =
  (adapter: MotionAdapter): Decorator =>
  (Story) => (
    <MotionAdapterProvider adapter={adapter}>
      <Story />
    </MotionAdapterProvider>
  );
