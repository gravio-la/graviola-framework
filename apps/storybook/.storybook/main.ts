import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
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

    return config;
  },
};
export default config;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
