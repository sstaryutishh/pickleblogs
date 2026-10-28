import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getArticle, getArticlePage, getArticles, getPageCount, getRelatedArticles, isPublished, parseArticle, renderArticle } from "../lib/articles";
import { articleJsonLd, articleMetadata, indexMetadata, serializeJsonLd } from "../lib/seo";
import { absoluteUrl, formatDate, pagePath, PAGE_SIZE } from "../lib/site";
import sitemap from "../app/blog/sitemap";

const sampleFile = "designing-interfaces-people-understand.md";
const sampleSource = readFileSync(`content/blog/${sampleFile}`, "utf8");

test("the catalog has unique slugs, titles, descriptions, and descending dates", () => {
  const articles = getArticles();
  assert.ok(articles.length > PAGE_SIZE, "Pagination needs a real second page");
  for (const key of ["slug", "title", "description"] as const) {
    assert.equal(new Set(articles.map((a) => a[key])).size, articles.length);
  }
  assert.deepEqual(articles.map((a) => a.date), articles.map((a) => a.date).sort().reverse());
});

test("drafts and future dates are not public, including by a direct slug", () => {
  const now = new Date("2026-10-28T12:00:00Z");
  assert.equal(isPublished({ draft: true, date: "2026-01-01" }, now), false);
  assert.equal(isPublished({ draft: false, date: "2026-10-29" }, now), false);
  assert.equal(isPublished({ draft: false, date: "2026-10-28" }, now), true);
  assert.equal(getArticle("a-small-draft-example"), undefined);
  assert.equal(getArticle("../../package"), undefined);
  assert.equal(getArticle("not-a-real-article"), undefined);
});

test("pagination discovers every article exactly once and rejects invalid pages", () => {
  const articles = getArticles();
  const paginated = Array.from({ length: getPageCount() }, (_, i) => getArticlePage(i + 1)!).flat();
  assert.deepEqual(paginated.map((a) => a.slug), articles.map((a) => a.slug));
  for (const page of [0, -1, 1.5, NaN, Infinity, getPageCount() + 1]) assert.equal(getArticlePage(page), undefined);
  assert.equal(pagePath(1), "/blog");
  assert.equal(pagePath(2), "/blog/page/2");
});

test("frontmatter validation rejects missing fields, invalid dates, reserved slugs, and missing images", () => {
  assert.throws(() => parseArticle(sampleFile, sampleSource.replace('date: "2026-08-05"', 'date: "2026-02-30"')), /date/);
  assert.throws(() => parseArticle(sampleFile, sampleSource.replace("draft: false", 'draft: "false"')), /draft/);
  assert.throws(() => parseArticle("page.md", sampleSource), /reserved/);
  assert.throws(() => parseArticle(sampleFile, sampleSource.replace('category: "UI/UX"', 'category: ""')), /category/);
  assert.throws(() => parseArticle(sampleFile, sampleSource.replace("intuitive-interfaces.webp", "nonexistent.webp")), /Missing image/);
  assert.throws(() => parseArticle(sampleFile, sampleSource + "\n# Another title\n"), /H1/);
});

test("every internal content link and related story points to a published page", () => {
  for (const article of getArticles()) {
    for (const match of article.content.matchAll(/\]\(\/blog\/([^\s)#]+)(?:#[^)]*)?\)/g)) {
      assert.ok(getArticle(match[1]), `${article.slug} links to unpublished ${match[1]}`);
    }
    for (const related of getRelatedArticles(article)) {
      assert.notEqual(related.slug, article.slug);
      assert.ok(getArticle(related.slug));
    }
  }
});

test("Markdown renders semantic content and does not execute raw HTML", async () => {
  const rendered = await renderArticle('## A heading\n\n- One\n- Two\n\n[Visit](/blog)\n\n<script>alert(1)</script>\n\n[Bad](javascript:alert(1))');
  assert.match(rendered, /<h2>A heading<\/h2>/);
  assert.match(rendered, /<ul>/);
  assert.match(rendered, /href="\/blog"/);
  assert.doesNotMatch(rendered, /<script|javascript:/);
});

test("SEO uses public canonical URLs, distinct archive descriptions, and safe structured data", () => {
  assert.notEqual(indexMetadata(1).description, indexMetadata(2).description);
  for (const article of getArticles()) {
    const metadata = articleMetadata(article);
    const data = articleJsonLd(article);
    assert.equal(metadata.alternates?.canonical, absoluteUrl(`/blog/${article.slug}`));
    assert.equal(data["@type"], "BlogPosting");
    assert.equal(data.headline, article.title);
    assert.ok(data.datePublished.endsWith("T00:00:00Z"));
    assert.equal(data.mainEntityOfPage["@id"], data.url);
  }
  assert.doesNotMatch(serializeJsonLd({ title: "</script><script>alert(1)</script>" }), /</);
});

test("sitemap contains all public articles and archives with no draft or duplicate URLs", () => {
  const entries = sitemap();
  assert.equal(entries.length, getArticles().length + getPageCount());
  assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length);
  assert.ok(entries.every((entry) => entry.url.startsWith("https://trypickle.site/blog")));
  assert.ok(!entries.some((entry) => entry.url.includes("draft")));
  assert.equal(formatDate("2026-10-28"), "Oct 28, 2026");
});
