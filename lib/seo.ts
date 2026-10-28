import type { Metadata } from "next";
import type { Article } from "./articles";
import { absoluteUrl, BLOG_DESCRIPTION, pagePath, SITE_NAME, SITE_URL } from "./site";

export function indexMetadata(page = 1): Metadata {
  const title = page === 1 ? "The Pickle Blog — Productivity & Thoughtful Design" : `The Pickle Blog — Page ${page}`;
  const description = page === 1 ? BLOG_DESCRIPTION
    : `More from Pickle: practical ideas for calmer work, iPhone productivity, and considered design. Browse page ${page} of our journal.`;
  const url = absoluteUrl(pagePath(page));
  return {
    title: { absolute: title }, description, alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: SITE_NAME,
      images: [{ url: absoluteUrl("/blog/assets/social-cover.png"), width: 1200, height: 630, alt: "The Pickle Blog. A little less busy." }] },
    twitter: { card: "summary_large_image", title, description, images: [absoluteUrl("/blog/assets/social-cover.png")] },
  };
}

export function articleMetadata(article: Article): Metadata {
  const title = `${article.title} | Pickle`;
  const url = absoluteUrl(`/blog/${article.slug}`);
  const image = absoluteUrl(article.hero || "/blog/assets/social-cover.png");
  return {
    title: { absolute: title }, description: article.description,
    alternates: { canonical: url },
    openGraph: { title, description: article.description, url, type: "article", siteName: SITE_NAME,
      publishedTime: article.date, modifiedTime: article.updated || article.date,
      authors: [SITE_URL], section: article.category,
      images: [{ url: image, alt: article.heroAlt || "The Pickle Blog" }] },
    twitter: { card: "summary_large_image", title, description: article.description, images: [image] },
  };
}

export function articleJsonLd(article: Article) {
  const url = absoluteUrl(`/blog/${article.slug}`);
  return {
    "@context": "https://schema.org", "@type": "BlogPosting", "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url }, url,
    headline: article.title, description: article.description,
    image: [absoluteUrl(article.hero || "/blog/assets/social-cover.png")],
    datePublished: `${article.date}T00:00:00Z`, dateModified: `${article.updated || article.date}T00:00:00Z`,
    author: { "@type": "Organization", name: "Pickle", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Pickle", url: SITE_URL,
      logo: { "@type": "ImageObject", url: absoluteUrl("/blog/assets/pickle-icon.png") } },
    articleSection: article.category, inLanguage: "en-US",
    wordCount: article.content.trim().split(/\s+/).length,
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
