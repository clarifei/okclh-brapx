import type { APIRoute } from "astro";

const TRAILING_SLASH_REGEX = /\/$/;

export const GET: APIRoute = ({ site }) => {
  const siteUrl = site ? site.toString().replace(TRAILING_SLASH_REGEX, "") : "";
  const sitemapUrl = siteUrl
    ? `${siteUrl}/sitemap-index.xml`
    : "/sitemap-index.xml";
  const body = `User-agent: *
Allow: /
Sitemap: ${sitemapUrl}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
