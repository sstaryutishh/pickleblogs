import type { MetadataRoute } from "next";
import { getArticles, getPageCount } from "@/lib/articles";
import { absoluteUrl, pagePath } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getArticles();
  return [
    ...Array.from({ length: getPageCount() }, (_, index) => ({ url: absoluteUrl(pagePath(index + 1)) })),
    ...articles.map((article) => ({ url: absoluteUrl(`/blog/${article.slug}`), lastModified: article.updated || article.date })),
  ];
}
