import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import type { StorybookConfig } from "@storybook/react-vite";
import mermaid from "mdx-mermaid";
import remarkGfm from "remark-gfm";
import { remarkStorybookLinks } from "./remarkStorybookLinks.ts";

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    {
      name: getAbsolutePath("@storybook/addon-docs"),
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm, remarkStorybookLinks, mermaid],
          },
        },
      },
    },
    getAbsolutePath("@storybook/addon-vitest"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  staticDirs: ["../public"],
  env: (config) => {
    console.log("🔍 Vite Storybook Environment Variables during build:");
    console.log("STORYBOOK_CUSTOM_VAR:", process.env.STORYBOOK_CUSTOM_VAR);

    return {
      ...config,
      STORYBOOK_CUSTOM_VAR:
        process.env.STORYBOOK_CUSTOM_VAR || "Default Custom Value",
    };
  },
  viteFinal: async (config) => {
    const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
    const require = createRequire(import.meta.url);
    const bufferPath = require.resolve("buffer/");
    const basePath = process.env.STORYBOOK_BASE_PATH || "";
    const normalizedBase = basePath
      ? `${basePath.replace(/\/+$/, "")}/`
      : undefined;

    // Add support for .nq and .ttl files (Turtle/RDF formats)
    config.assetsInclude = [
      "**/*.nq",
      "**/*.nt",
      "**/*.ttl",
      "**/*.rdf",
      "**/*.owl",
    ];

    // Configure JSX transform to use react-jsx (automatic JSX transform)
    config.esbuild = {
      ...config.esbuild,
      jsx: "automatic",
      jsxImportSource: "react",
    };

    // Ensure React runs in development mode
    config.define = {
      ...config.define,
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development",
      ),
      global: "globalThis",
    };

    const existingOnWarn = config.build?.rollupOptions?.onwarn;
    config.build = {
      ...config.build,
      rollupOptions: {
        ...config.build?.rollupOptions,
        onwarn(warning, defaultHandler) {
          if (
            warning.code === "MODULE_LEVEL_DIRECTIVE" &&
            warning.message.includes("use client")
          ) {
            return;
          }
          if (existingOnWarn) {
            existingOnWarn(warning, defaultHandler);
            return;
          }
          defaultHandler(warning);
        },
      },
    };

    const dedupe = new Set([...(config.resolve?.dedupe ?? [])]);
    dedupe.add("react");
    dedupe.add("react-dom");
    dedupe.add("@mui/material");
    dedupe.add("@mui/x-date-pickers");
    config.resolve = {
      ...config.resolve,
      alias: {
        ...(typeof config.resolve?.alias === "object"
          ? config.resolve.alias
          : {}),
        "~awesomplete": "awesomplete",
        "~@chenfengyuan/datepicker": "@chenfengyuan/datepicker",
        buffer: bufferPath,
        "node:buffer": bufferPath,
        "@graviola/semantic-views": join(
          repoRoot,
          "packages/semantic-views/src/index.ts",
        ),
      },
      dedupe: Array.from(dedupe),
    };

    if (normalizedBase) {
      config.base = normalizedBase;
    }

    config.optimizeDeps = {
      ...config.optimizeDeps,
      include: [...(config.optimizeDeps?.include ?? []), "buffer"],
      exclude: [
        ...(config.optimizeDeps?.exclude ?? []),
        "@graviola/semantic-views",
      ],
    };

    config.server = {
      ...config.server,
      fs: {
        allow: [repoRoot, ...(config.server?.fs?.allow ?? [])],
      },
    };

    return config;
  },
};
export default config;

function getAbsolutePath(value: string): any {
  const require = createRequire(import.meta.url);
  return dirname(require.resolve(`${value}/package.json`));
}
