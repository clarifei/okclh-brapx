"use strict";
const path = require("node:path");

const host = process.env.HOST ?? "0.0.0.0";
const port = process.env.PORT ?? "4321";
const siteUrl = process.env.SITE_URL ?? "https://oklch.biarapa.com";
const astroCli = path.join(__dirname, "node_modules", "astro", "astro.js");

module.exports = {
  apps: [
    {
      name: "oklch-gen",
      cwd: __dirname,
      script: "node",
      args: [astroCli, "preview", "--host", host, "--port", port],
      autorestart: true,
      watch: false,
      time: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        HOST: host,
        PORT: port,
        SITE_URL: siteUrl,
      },
      env_production: {
        NODE_ENV: "production",
        HOST: host,
        PORT: port,
        SITE_URL: siteUrl,
      },
    },
  ],
};
