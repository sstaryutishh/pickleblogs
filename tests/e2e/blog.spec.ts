import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { getArticles, getArticlePage, getPageCount } from "../../lib/articles";
import { PAGE_SIZE } from "../../lib/site";

test("the root serves the local blog and home links stay on the same host", async ({ page, request, baseURL }) => {
  const root = await request.get("/", { maxRedirects: 0 });
  expect(root.status()).toBe(200);
  expect(root.headers().location).toBeUndefined();
  await page.goto("/");
  await expect(page.locator(".blog-index")).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://trypickle.site/blog");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", "https://trypickle.site/blog");
  for (const selector of [".brand", ".footer-link", ".footer-wordmark"]) {
    await page.goto("/blog/best-iphone-productivity-apps-2026");
    await expect(page.locator(selector)).toHaveAttribute("href", "/");
    await page.locator(selector).click();
    await expect(page).toHaveURL(new URL("/", baseURL!).toString());
    await expect(page.locator(".blog-index")).toBeVisible();
  }
});

test("the index matches the compact layout and Read More navigates to real articles", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.locator(".article-card")).toHaveCount(Math.min(PAGE_SIZE, getArticles().length));
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Pickle homepage" })).toHaveAttribute("href", "/");
  const column = await page.locator(".blog-index").boundingBox();
  expect(column!.width).toBe(460);
  await page.getByRole("link", { name: /Read More/ }).click();
  await expect(page).toHaveURL(/\/blog\/page\/2$/);
  await expect(page.locator(".article-card")).toHaveCount(getArticlePage(2)!.length);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://trypickle.site/blog/page/2");
  await page.getByRole("link", { name: "← Newer stories" }).click();
  await expect(page).toHaveURL(/\/blog$/);
});

test("article pages have real content, metadata, related links, and a working return link", async ({ page }) => {
  await page.goto("/blog/best-iphone-productivity-apps-2026");
  await expect(page).toHaveURL(/best-iphone-productivity-apps-2026$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("10 Best iPhone Productivity Apps in 2026 That Actually Make You More Productive");
  expect(await page.locator(".prose h2").count()).toBeGreaterThan(10);
  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(data["@type"]).toBe("BlogPosting");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator(".related-link")).toHaveCount(2);
  await page.getByRole("link", { name: "← Back to the blog" }).click();
  await expect(page).toHaveURL(/\/blog$/);
});

test("articles and pagination are usable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/blog");
  await page.getByRole("link", { name: /Read More/ }).click();
  await expect(page).toHaveURL(/\/blog\/page\/2$/);
  await page.locator(".article-card-link").first().click();
  await expect(page.locator(".prose")).toBeVisible();
  await context.close();
});

for (const width of [320, 390, 768, 1440]) {
  test(`index and article fit a ${width}px viewport with loaded images`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    for (const route of ["/blog", "/blog/modern-css-patterns"]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const imagesLoaded = await page.locator("img").evaluateAll((images) => images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0));
      expect(imagesLoaded).toBe(true);
      await page.screenshot({ path: `test-results/${route === "/blog" ? "index" : "article"}-${width}.png`, fullPage: true });
    }
  });
}

test("index and article pass automated accessibility checks", async ({ page }) => {
  for (const route of ["/blog", "/blog/designing-interfaces-people-understand"]) {
    await page.goto(route);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  }
});

test("missing, draft, and invalid archive URLs return HTTP 404", async ({ request }) => {
  for (const route of ["/blog/does-not-exist", "/blog/a-small-draft-example", "/blog/page/999", "/blog/page/0", "/blog/page/02"]) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(404);
    expect(await response.text()).toContain('name="robots" content="noindex"');
  }
  const first = await request.get("/blog/page/1", { maxRedirects: 0 });
  expect(first.status()).toBe(308);
  expect(first.headers().location).toBe("/blog");
});

test("sitemap discovers all articles and robots advertises the public sitemap", async ({ request }) => {
  const response = await request.get("/blog/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(urls).toHaveLength(getArticles().length + getPageCount());
  expect(xml).not.toContain("a-small-draft-example");
  const titles = new Set<string>();
  for (const url of urls) {
    const page = await request.get(new URL(url).pathname);
    expect(page.status()).toBe(200);
    const body = await page.text();
    expect(body).toContain(`rel="canonical" href="${url}"`);
    titles.add(body.match(/<title>(.*?)<\/title>/)![1]);
  }
  expect(titles.size).toBe(urls.length);
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Sitemap: https://trypickle.site/blog/sitemap.xml");
});

test("all page assets stay beneath the Framer /blog rewrite boundary", async ({ page }) => {
  const failures: string[] = [];
  page.on("response", (response) => { if (response.status() >= 400) failures.push(response.url()); });
  await page.goto("/blog", { waitUntil: "networkidle" });
  const assets = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => new URL(entry.name).pathname));
  expect(assets.length).toBeGreaterThan(0);
  expect(assets.filter((url) => !url.startsWith("/blog/"))).toEqual([]);
  expect(failures).toEqual([]);
});
