import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  "/run/current-system/sw/bin/chromium";

export default defineConfig({
  plugins: [
    storybookTest({
      configDir: join(__dirname, ".storybook"),
    }),
  ],
  test: {
    name: "storybook",
    exclude: [
      "stories/packages/edb-sparnatural/EdbSparnatural.stories.tsx",
      "stories/packages/edb-sparnatural/QuerySparnatural.stories.tsx",
    ],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: {
          executablePath: chromiumExecutablePath,
        },
      }),
      instances: [
        {
          browser: "chromium",
        },
      ],
    },
    setupFiles: [".storybook/vitest.setup.ts"],
  },
});
