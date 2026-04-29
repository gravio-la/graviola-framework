import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { createRequire } from "node:module";
import type { StorybookConfig } from "@storybook/react-vite";
import mermaid from "mdx-mermaid";

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
            remarkPlugins: [mermaid],
          },
        },
      },
    },
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  staticDirs: ["../public"],
  env: (config) => {
    console.log("🔍 Vite Storybook Environment Variables during build:");
    console.log("STORYBOOK_BASE_PATH:", process.env.STORYBOOK_BASE_PATH);
    console.log("STORYBOOK_CUSTOM_VAR:", process.env.STORYBOOK_CUSTOM_VAR);

    return {
      ...config,
      STORYBOOK_BASE_PATH: process.env.STORYBOOK_BASE_PATH || "",
      VITE_BASE_PATH: process.env.STORYBOOK_BASE_PATH || "",
      STORYBOOK_CUSTOM_VAR:
        process.env.STORYBOOK_CUSTOM_VAR || "Default Custom Value",
    };
  },
  viteFinal: async (config) => {
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
      dedupe: Array.from(dedupe),
    };

    if (normalizedBase) {
      config.base = normalizedBase;
    }

    return config;
  },
};
export default config;

function getAbsolutePath(value: string): any {
  const require = createRequire(import.meta.url);
  return dirname(require.resolve(`${value}/package.json`));
}
