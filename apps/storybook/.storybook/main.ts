import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-docs",
    "@storybook/addon-controls",
    "@storybook/addon-actions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    builder: "@storybook/builder-vite",
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
    config.assetsInclude = ["**/*.nq", "**/*.ttl", "**/*.rdf", "**/*.owl"];

    // Configure JSX transform to use react-jsx (automatic JSX transform)
    config.esbuild = {
      ...config.esbuild,
      jsx: "automatic",
      jsxImportSource: "react",
    };

    return config;
  },
};
export default config;
