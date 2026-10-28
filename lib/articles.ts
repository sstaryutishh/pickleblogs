import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import gfm from "remark-gfm";
import { PAGE_SIZE } from "./site";

const contentDirectory = path.join(process.cwd(), "content/blog");
const reservedSlugs = new Set(["page", "assets", "_next", "sitemap", "robots", "feed"]);

export type Article = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: string;
  date: string;
  updated?: string;
  draft: boolean;
  image: string;
  imageAlt: string;
  hero?: string;
  heroAlt?: string;
  heroWidth?: number;
  heroHeight?: number;
  related: string[];
  content: string;
  readingMinutes: number;
};

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

export function parseArticle(filename: string, source: string): Article {
  const slug = filename.replace(/\.md$/, "");
  const { data, content } = matter(source);
  const fail = (message: string): never => { throw new Error(`${filename}: ${message}`); };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || reservedSlugs.has(slug)) {
    fail("Use a unique, lowercase, hyphenated filename that is not a reserved route.");
  }
  const text = (field: string): string => {
    const value: unknown = data[field];
    if (typeof value !== "string" || !value.trim()) return fail(`Missing ${field}.`);
    return value.trim();
  };
  if (!validDate(data.date)) fail('date must be a quoted, valid "YYYY-MM-DD" date.');
  if (data.updated !== undefined && !validDate(data.updated)) fail("Invalid updated date.");
  if (data.updated && data.updated < data.date) fail("updated cannot precede date.");
  if (typeof data.draft !== "boolean") fail("Set draft explicitly to true or false.");
  if (!Array.isArray(data.related) || !data.related.every((value: unknown) => typeof value === "string")) {
    fail("related must be a list of article slugs.");
  }
  if (/^#\s/m.test(content)) fail("Start content headings at ##; the template supplies the H1.");
  if (content.trim().split(/\s+/).length < 200 && !data.draft) fail("Published articles need at least 200 words.");
  const image = text("image");
  for (const dimension of ["heroWidth", "heroHeight"]) {
    if (data[dimension] !== undefined && (!Number.isSafeInteger(data[dimension]) || data[dimension] <= 0)) {
      fail(`${dimension} must be a positive integer.`);
    }
  }
  for (const asset of [image, data.hero].filter(Boolean)) {
    if (typeof asset !== "string" || !/^\/blog\/assets\/[a-z0-9-]+\.(webp|png|jpg|svg)$/.test(asset)) {
      fail("Images must use a local /blog/assets/filename path.");
    }
    if (!fs.existsSync(path.join(process.cwd(), "public", asset))) fail(`Missing image: ${asset}`);
  }
  return {
    slug, title: text("title"), description: text("description"), excerpt: text("excerpt"),
    category: text("category"), date: data.date, updated: data.updated, draft: data.draft,
    image, imageAlt: text("imageAlt"), hero: data.hero,
    heroAlt: data.hero ? text("heroAlt") : undefined,
    heroWidth: data.hero ? (data.heroWidth ?? 1200) : undefined,
    heroHeight: data.hero ? (data.heroHeight ?? 800) : undefined,
    related: data.related, content,
    readingMinutes: Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 220)),
  };
}

let catalog: Article[] | undefined;
function readCatalog(): Article[] {
  if (catalog && process.env.NODE_ENV === "production") return catalog;
  catalog = fs.readdirSync(contentDirectory).filter((file) => file.endsWith(".md"))
    .map((file) => parseArticle(file, fs.readFileSync(path.join(contentDirectory, file), "utf8")))
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  for (const article of catalog) {
    for (const slug of article.related) {
      if (slug === article.slug || !catalog.some((other) => other.slug === slug)) {
        throw new Error(`${article.slug}: invalid related article ${slug}`);
      }
    }
  }
  return catalog;
}

export function isPublished(article: Pick<Article, "draft" | "date">, now = new Date()) {
  return !article.draft && article.date <= now.toISOString().slice(0, 10);
}

export function getArticles(): Article[] {
  return readCatalog().filter((article) => isPublished(article));
}

export function getArticle(slug: string) {
  // Match against the catalog; never interpolate untrusted slugs into file paths.
  return getArticles().find((article) => article.slug === slug);
}

export function getPageCount() {
  return Math.max(1, Math.ceil(getArticles().length / PAGE_SIZE));
}

export function getArticlePage(page: number) {
  if (!Number.isSafeInteger(page) || page < 1 || page > getPageCount()) return undefined;
  return getArticles().slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

export function getRelatedArticles(article: Article, limit = 2) {
  const candidates = getArticles().filter((other) => other.slug !== article.slug);
  return [...candidates].sort((a, b) => {
    const score = (item: Article) => (article.related.includes(item.slug) ? 2 : 0)
      + (item.category === article.category ? 1 : 0);
    return score(b) - score(a);
  }).slice(0, limit);
}

export async function renderArticle(content: string) {
  // Markdown only; raw HTML and executable MDX are intentionally not enabled.
  return String(await remark().use(gfm).use(html, { sanitize: true }).process(content));
}
