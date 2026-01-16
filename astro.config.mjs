// @ts-check

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const site = process.env.SITE_URL ?? "https://oklch.biarapa.com";

// https://astro.build/config
export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
    preview: {
      allowedHosts: ["oklch.biarapa.com"],
    },
  },

  integrations: [react(), sitemap()],
});
