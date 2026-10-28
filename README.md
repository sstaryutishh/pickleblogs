# Pickle blog

A deliberately small editorial blog for `https://trypickle.site/blog`, built with Next.js App Router, TypeScript, plain CSS, and Markdown. The existing Framer site remains the homepage. This repository was empty before implementation; no existing application, routing configuration, or Git history was replaced.

## Run locally

Use Node.js 22 or 24 LTS and npm. Dependencies are locked in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open **http://localhost:3000/** or **http://localhost:3000/blog**. Both render the local blog without redirecting. Clicking Pickle branding or product links opens `https://trypickle.site/`. Article and pagination links stay local. Canonical and social URLs still point to `https://trypickle.site/blog`; metadata does not navigate the browser. Restart the dev server after changing `next.config.ts`.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:build
npm run start
```

For browser tests, install Playwright Chromium once with `npx playwright install chromium`, then run `npm run test:e2e`. If Google Chrome is already installed, run `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`. The browser suite starts the production build on port 3100. Run the build first. `npm run check` runs the full sequence.

The generated-output tests check the local root page, public branding links, production SEO URLs, static articles, and archive routing. Browser tests also cover home-link navigation, responsive screenshots, click-through behavior, and accessibility. The implementation workspace previously blocked local servers (`EPERM`) and Chrome, so browser verification requires a machine that permits those processes.

## Project map

| Location | Purpose |
| --- | --- |
| `app/page.tsx` | Reuses the blog at this app's root, with `/blog` as its public canonical |
| `app/blog/page.tsx` | Static first page with four article previews |
| `app/blog/page/[page]/page.tsx` | Static, crawlable subsequent pages |
| `app/blog/[slug]/page.tsx` | Shared static article template and JSON-LD |
| `components/` | Branding, article cards, index, footer |
| `content/blog/*.md` | Eight published stories and one excluded draft example |
| `lib/articles.ts` | Metadata validation, publication rules, Markdown, pagination, related stories |
| `lib/seo.ts`, `lib/site.ts` | Canonicals, social metadata, structured data, site constants |
| `app/blog/sitemap.ts` | Public blog sitemap at `/blog/sitemap.xml` |
| `app/sitemap.ts`, `app/robots.ts` | Sitemap and robots endpoints on the Vercel origin |
| `app/not-found.tsx` | Missing article/page handling |
| `app/globals.css` | Responsive layout and typography |
| `public/blog/assets/` | Committed local images, including share image |
| `tests/` | Content/SEO unit tests and Playwright browser checks |
| `docs/deployment.md` | Exact Vercel and Framer routing instructions |

## Add an article

1. Copy `content/blog/a-small-draft-example.md` to a new, lowercase, hyphenated filename, such as `a-more-focused-morning.md`. The filename is the permanent slug: `/blog/a-more-focused-morning`.
2. Fill in the frontmatter and write the article in Markdown. Use `##` for sections and `###` for subsections; the template supplies the only H1. Markdown HTML is sanitized, and executable MDX is not enabled.
3. Place a thumbnail in `public/blog/assets/` and use its `/blog/assets/filename.webp` URL. Include meaningful alt text. For sharper thumbnails, use a source around 400×288 pixels. Optional `hero` and `heroAlt` fields add a large article image; use a source at least 1200px wide. Set `heroWidth` and `heroHeight` to its pixel dimensions (defaults: 1200×800) so the template reserves the correct space and preserves the full image. All assets stay inside the `/blog` routing boundary.
4. Give the post a unique title, description, and excerpt. Set `related` to existing article slugs. Add contextual Markdown links such as `[Read more](/blog/one-good-task-at-a-time)`.
5. Keep `draft: true` until ready. Set `draft: false` and use a publication date on or before the build date to publish. Dates must be quoted `YYYY-MM-DD` values in UTC. An optional `updated` date records a substantive revision.
6. Run the checks, commit, and redeploy. The index, archives, article routes, related links, and sitemap regenerate from the content directory.

```yaml
---
title: "A More Focused Morning"
description: "A unique, useful search description for this article."
excerpt: "A short introduction for the article list."
category: "Productivity"
date: "2026-10-28"
draft: true
image: "/blog/assets/iphone-productivity.webp"
imageAlt: "An iPhone with a compact productivity widget"
related:
  - one-good-task-at-a-time
---
```

Drafts and future-dated posts are excluded from every public content surface and return 404 by direct URL. Scheduled dates are checked **at build time**: a future post requires a new deployment on or after that date. There is no automatic scheduler or runtime draft preview. A draft is readable locally as Markdown; to preview its rendered layout, temporarily set a current date and `draft: false`, then restore those values before committing.

The build fails for missing required metadata, invalid dates, missing images, invalid related slugs, H1s inside content, and published posts with fewer than 200 words. The word minimum is a guard against accidentally publishing a template, not a measure of editorial quality. Unit tests also check uniqueness and published internal links.

Avoid renaming published slugs. If a URL must change, add a permanent redirect in `next.config.ts` and update internal links. For hundreds of posts, the build loads one metadata catalog per process and renders only each post's own Markdown. Pagination remains four posts per page; change `PAGE_SIZE` in `lib/site.ts` if needed.

## Design and assets

The index uses a 460px desktop column, 100×72px thumbnails, compact Inter type, an Instrument Serif wordmark, and a restrained footer. On small screens the two-column rows remain intact and wrap naturally. Fonts are bundled locally through Fontsource; neither the build nor visitors need Google Fonts.

The header icon uses the supplied `pickle.png`. The first article uses the supplied Shopify dashboard artwork for its thumbnail and full-width hero. Other list thumbnails retain the reference crops; replace those low-resolution crops with original product photography when available. See `public/blog/assets/SOURCES.md` for provenance. All web assets are committed under `public/`; the build does not depend on Downloads or sibling folders.

All links are real document navigations, including pagination. Content and navigation work without JavaScript, and navigation does not depend on a reverse proxy preserving Next.js RSC cache headers. Pickle branding and product links open `https://trypickle.site/`; internal blog links stay on the current host. The app root itself still renders the local blog without a redirect.

## SEO and publishing

Every article and archive is statically generated, with a unique title/description, public canonical URL, Open Graph/Twitter metadata, and a `BlogPosting` JSON-LD object. Related articles and sequential pagination make older posts discoverable. `/blog/page/1` redirects permanently to `/blog`; malformed pages and unpublished/missing slugs return 404 with `noindex`.

**Read [the deployment guide](docs/deployment.md) before attaching any production domain.** The recommended setup keeps DNS and the homepage on Framer and forwards only `/blog` and `/blog/*` to Vercel. No deployment, DNS modification, or Framer publishing action is performed by this repository.

## Web Analytics

Vercel Web Analytics is installed through `@vercel/analytics` and rendered once in `app/layout.tsx`, covering the root, blog index, archives, and articles. The official Next.js component handles page views and route tracking. Development mode uses the SDK's debug behavior; real visitor data requires a deployed Vercel project with Web Analytics enabled.

After deploying these changes, visit the deployed blog, navigate between articles, and check the project's **Analytics** tab. If data does not appear after about 30 seconds, check browser content blockers and that Web Analytics is enabled. See [Vercel's setup guide](https://vercel.com/docs/analytics/quickstart). No API key is required in this app.

On a domain served directly by Vercel, such as the configured blog subdomain, Vercel supplies the analytics endpoints. A future Framer reverse-proxy setup also needs to forward the analytics script and collection paths; see the deployment guide.
