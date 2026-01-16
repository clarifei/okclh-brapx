// @ts-check

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const site = process.env.SITE_URL ?? "https://oklch.biarapa.com";

export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
    preview: {
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "oklch.biarapa.com",
        "*.trycloudflare.com",
        "*",
      ],
    },
    server: {
      host: true,
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "oklch.biarapa.com",
        "*.trycloudflare.com",
        "*",
      ],
    },
  },

  integrations: [react(), sitemap()],
});
