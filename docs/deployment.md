# Publish the blog alongside the existing Framer site

## Intended ownership

| Public URL | Served by |
| --- | --- |
| `https://trypickle.site/` and existing non-blog pages | Existing Framer project |
| `https://trypickle.site/blog` | This Next.js app on Vercel |
| `https://trypickle.site/blog/*` | This Next.js app, including articles, archives, images, fonts, scripts, and blog sitemap |
| `https://trypickle.site/robots.txt` | Framer; preserve existing directives and add the blog sitemap |
| `https://trypickle.site/sitemap.xml` | Existing Framer sitemap |

The recommended configuration requires **no DNS changes**. Framer remains the public host and reverse-proxies the two blog paths to the Vercel production origin. DNS cannot route individual paths; adding a DNS record for `/blog` is not possible.

Framer's current requirements are a Pro plan with the Advanced Hosting add-on, or Enterprise. Confirm this in the existing project's account before publishing the rewrite rules. See [Framer's hosting requirements](https://www.framer.com/help/articles/how-to-self-host-using-reverse-proxy/) and [Multi Site instructions](https://www.framer.com/help/articles/how-to-use-multi-site-with-rewrite-rules/).

## 1. Deploy this repository to Vercel

1. Push the project to a Git repository. In Vercel, choose **Add New → Project**, import it, and select the directory containing `package.json` as the root directory.
2. Use the **Next.js** framework preset, Node.js **24.x**, install command `npm ci`, and build command `npm run build`. Leave the output directory at its Next.js default. No application secrets or environment variables are needed.
3. Deploy and note the **stable production domain**, for example `pickle-blog.vercel.app`. Replace `BLOG_ORIGIN` in the rules below with that exact HTTPS origin. Do not use a per-commit preview domain.
4. Make that production alias publicly accessible to Framer. Preview deployments can remain protected. Confirm `/blog` is reachable while signed out; a Vercel authentication page cannot be used as the public blog origin. See [Vercel deployment protection](https://vercel.com/docs/deployment-protection).
5. Test `https://BLOG_ORIGIN/blog`, page 2, an article, a missing slug, `/blog/sitemap.xml`, `/robots.txt`, and the images/styles. Canonicals intentionally already name `https://trypickle.site`, even on the Vercel origin.

**Do not attach `trypickle.site` or `www.trypickle.site` to this Vercel project.** This app's root renders the blog for local development and direct-origin access; attaching the apex directly would bypass the existing Framer homepage. Forward only the two blog paths below so Framer retains the public root. There is no application redirect from `/` to production, and local logo/footer links remain on the current host.

## 2. Add exactly two Framer external rewrites

In the existing Framer project, open **Site Settings → Hosting → Multi Site → Add**. Select **External** and create these rules, preserving the paths:

| Source path | Destination URL (replace the example origin) |
| --- | --- |
| `/blog` | `https://pickle-blog.vercel.app/blog` |
| `/blog/*` | `https://pickle-blog.vercel.app/blog/:1` |

Framer uses `:1` to insert the captured wildcard. The exact `/blog` rule covers the index; the wildcard covers articles, pagination, `/blog/assets/*`, `/blog/_next/*`, and `/blog/sitemap.xml`. Put these before any existing broad rules that would match them. Publish the Framer project for the changes to take effect. The homepage remains the existing Framer page.

The application uses Next.js's multi-zone `assetPrefix: "/blog"`. Its generated bundles are served under `/blog/_next/`, and public images are under `/blog/assets/`. There is no need to forward the global `/_next/*` path or change `basePath`; adding a `/blog` basePath to the existing route tree would produce `/blog/blog` URLs. This setup follows the [Next.js multi-zone model](https://nextjs.org/docs/app/guides/multi-zones).

If there is an old Framer `/blog` page, the rewrite takes precedence. Check any existing article URLs before replacing the blog path, and add explicit redirects for old published slugs if necessary. The original site could not be fetched from the implementation environment, so existing blog URLs and account capabilities have not been verified.

## 3. Register the sitemap without replacing the homepage sitemap

The blog sitemap is **`https://trypickle.site/blog/sitemap.xml`**. It lists every published article and each archive page. Leave Framer's `/sitemap.xml` in place so its existing homepage and other pages remain discoverable.

1. Download the current public `/robots.txt` and keep its existing rules and sitemap lines.
2. Add this additional line to that file:

   ```text
   Sitemap: https://trypickle.site/blog/sitemap.xml
   ```

3. Upload the merged `robots.txt` to `/` using Framer's **Static Files** feature and publish. Framer documents this under [custom robots.txt](https://www.framer.com/help/articles/how-can-i-access-the-robots-txt-file/). Check that no retained rule blocks `/blog` or its assets. Do not replace the file with this app's origin-only robots response: preserve the existing Framer sitemap and crawl policy.
4. Submit `/blog/sitemap.xml` in the existing domain's Google Search Console property, in addition to the Framer sitemap. If custom robots is unavailable, submit the sitemap directly and link to `/blog` from the Framer site; a valid root robots file and linked archive still allow discovery.
5. Add a normal link from the existing Framer homepage/footer to `/blog` so both visitors and crawlers can find the new section.

The repository also generates `/robots.txt` and `/sitemap.xml` on the Vercel origin for standalone validation. Only the `/blog/sitemap.xml` endpoint is forwarded by the two public rewrite rules.

## 4. Verify the public integration

After the Framer publish, check the actual public domain:

- `/` still displays the existing Framer homepage and its original metadata.
- `/blog` and `/blog/page/2` render with local fonts, thumbnails, styles, and no missing assets.
- “Read More,” “Newer stories,” article links, and the return link work without JavaScript.
- Clicking the Pickle logo or CTA returns to the Framer homepage.
- Directly opening `/blog/best-iphone-productivity-apps-2026` works and returns HTTP 200.
- `/blog/not-a-real-article` and `/blog/a-small-draft-example` return HTTP 404, not a 200 error page.
- The canonical and Open Graph URL on each page use `https://trypickle.site`, with only one canonical per page.
- `/blog/sitemap.xml` returns XML containing all public stories and no drafts; the root robots file allows the blog and advertises both sitemaps.
- A public article passes Google's Rich Results Test for its `BlogPosting` data. Social previews can fetch the `/blog/assets/` share image.

This integration must be checked on the real Framer/Vercel deployment; a local production build cannot verify account settings, CDN behavior, or the existing homepage.

## Releases, rollback, and alternate routing

New Markdown posts are deployed through the same Vercel project. Keep the production alias stable so Framer's rewrite destinations do not need to change. Future-dated posts become visible only after a build on or after the publication date. Use a scheduled deployment if you need timed publishing.

To roll back the blog content, promote the previous Vercel deployment. To remove the integration, remove the two Framer rules and publish, then remove the blog sitemap entry and homepage link if no longer needed. Framer's homepage and DNS are unaffected by either rollback.

If the Framer plan does not support Multi Site, the same-domain `/blog` requirement needs an external reverse proxy such as Vercel or Cloudflare. That is a separate infrastructure change: provision a stable Framer origin (`*.framer.website` or an origin subdomain), route `/blog` to this application, route all other paths to that Framer origin, retain both sitemap inventories, and test the entire configuration on a staging domain before changing the apex DNS. Never proxy the homepage back to `trypickle.site` after moving its DNS; that creates a loop. Framer also has hosting-plan requirements for this setup. This repository does not enable that alternative automatically. Prefer the two-rule, unchanged-DNS option above.
