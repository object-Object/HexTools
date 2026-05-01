import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-themes"],
  framework: "@storybook/react-vite",
  previewHead: (head) => `
    ${head}
    ${
      process.env.ENABLE_WEBGL_INSPECTOR
        ? '<script src="https://object-object.github.io/WebGL-Inspector/core/embed.js"></script>'
        : ""
    }
  `,
};

export default config;
