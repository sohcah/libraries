import { defineConfig } from "rspress/config";
import { pluginShiki } from "@rspress/plugin-shiki";

export default defineConfig({
  root: "content",
  title: "sohcah Libraries",
  plugins: [
    pluginShiki(),
  ],
  themeConfig: {
    socialLinks: [
      {
        icon: "github",
        mode: "link",
        content: "https://github.com/sohcah/libraries",
      },
    ],
  },
});
