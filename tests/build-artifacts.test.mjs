import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const output = ".next/server/app";
const manifest = JSON.parse(readFileSync(".next/prerender-manifest.json", "utf8"));
const routes = JSON.parse(readFileSync(".next/routes-manifest.json", "utf8"));
const urls = [...readFileSync(`${output}/blog/sitemap.xml.body`, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const htmlFor = (url) => readFileSync(path.join(output, `${new URL(url).pathname}.html`), "utf8");
const getTag = (html, name) => html.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`))?.[1];

test("each sitemap URL has a static HTML artifact with one H1, canonical, and distinct metadata", () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const url of urls) {
    const pathname = new URL(url).pathname;
    assert.equal(manifest.routes[pathname].initialRevalidateSeconds, false);
    const html = htmlFor(url);
    const head = getTag(html, "head");
    assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, pathname);
    assert.equal([...head.matchAll(/rel="canonical"/g)].length, 1, pathname);
    assert.ok(head.includes(`rel="canonical" href="${url}"`), pathname);
    titles.add(getTag(head, "title"));
    descriptions.add(head.match(/<meta name="description" content="([^"]+)"/)?.[1]);
    assert.match(head, /property="og:image"/);
    assert.match(head, /name="twitter:card" content="summary_large_image"/);
    assert.doesNotMatch(head, /name="robots" content="noindex/);
  }
  assert.equal(titles.size, urls.length);
  assert.equal(descriptions.size, urls.length);
  assert.ok(!titles.has(undefined) && !descriptions.has(undefined));
});

test("all emitted image, script, and stylesheet paths stay under /blog and exist on disk", () => {
  for (const url of urls) {
    const html = htmlFor(url);
    const sources = [...html.matchAll(/<(?:img|script)\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
    sources.push(...[...html.matchAll(/<link\b[^>]*\bhref="([^"\s]+\.css)"/g)].map((match) => match[1]));
    assert.ok(sources.length > 0);
    for (const source of sources) {
      assert.ok(source.startsWith("/blog/"), source);
      const asset = source.startsWith("/blog/_next/")
        ? path.join(".next", source.slice("/blog/_next/".length))
        : path.join("public", source);
      assert.ok(existsSync(asset), `Missing ${asset}`);
    }
    for (const image of html.matchAll(/<img\b[^>]*>/g)) assert.match(image[0], /alt="[^"]*"/);
  }
});

test("every article emits valid BlogPosting data and server-rendered editorial content", () => {
  const articleRoutes = Object.entries(manifest.routes).filter(([, data]) => data.srcRoute === "/blog/[slug]");
  for (const [route] of articleRoutes) {
    const html = htmlFor(`https://trypickle.site${route}`);
    const json = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
    assert.ok(json, route);
    const data = JSON.parse(json);
    assert.equal(data["@type"], "BlogPosting");
    assert.equal(data.url, `https://trypickle.site${route}`);
    assert.ok(data.wordCount >= 200);
    assert.match(html, /class="prose"><p>/);
    assert.match(html, /class="related-link"/);
  }
});

test("archives link to the next page and every article without script execution", () => {
  const archives = urls.filter((url) => /\/blog(?:\/page\/\d+)?$/.test(url));
  const linked = new Set();
  for (let index = 0; index < archives.length; index++) {
    const html = htmlFor(archives[index]);
    for (const match of html.matchAll(/class="article-card-link" href="([^"]+)"/g)) linked.add(match[1]);
    if (index < archives.length - 1) assert.match(html, /rel="next">Read More/);
    if (index > 0) assert.match(html, /rel="prev"/);
  }
  const expected = urls.filter((url) => !archives.includes(url)).map((url) => new URL(url).pathname);
  assert.deepEqual([...linked].sort(), expected.sort());
});

test("the root renders the local blog with production SEO metadata and same-host navigation", () => {
  assert.equal(manifest.routes["/"].initialRevalidateSeconds, false);
  assert.ok(!routes.redirects.some((route) => route.source === "/"));
  assert.ok(!routes.redirects.some((route) => /^https?:\/\//.test(route.destination)));
  const root = readFileSync(`${output}/index.html`, "utf8");
  assert.match(root, /class="blog-index"/);
  assert.match(root, /class="article-card-link" href="\/blog\//);
  assert.match(root, /class="brand" href="\/"/);
  assert.match(root, /href="\/" class="footer-link"/);
  assert.match(root, /href="\/" class="footer-wordmark"/);
  assert.match(root, /rel="canonical" href="https:\/\/trypickle.site\/blog"/);
  assert.match(root, /property="og:url" content="https:\/\/trypickle.site\/blog"/);
});

test("drafts have no output, 404 fallback is configured, and the first archive redirects to the blog", () => {
  assert.ok(!existsSync(`${output}/blog/a-small-draft-example.html`));
  assert.equal(manifest.dynamicRoutes["/blog/[slug]"].fallback, false);
  assert.equal(manifest.dynamicRoutes["/blog/page/[page]"].fallback, false);
  assert.equal(manifest.routes["/_not-found"].initialStatus, 404);
  const missing = readFileSync(`${output}/_not-found.html`, "utf8");
  assert.match(missing, /name="robots" content="noindex"/);
  assert.doesNotMatch(missing, /name="robots" content="index/);
  assert.ok(routes.redirects.some((route) => route.source === "/blog/page/1" && route.destination === "/blog" && route.statusCode === 308));
  const robots = readFileSync(`${output}/robots.txt.body`, "utf8");
  assert.match(robots, /Sitemap: https:\/\/trypickle.site\/blog\/sitemap.xml/);
});
