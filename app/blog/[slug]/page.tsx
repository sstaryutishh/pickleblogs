import Image from "next/image";
import { notFound } from "next/navigation";
import { getArticle, getArticles, getRelatedArticles, renderArticle } from "@/lib/articles";
import { articleJsonLd, articleMetadata, serializeJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return getArticles().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  return articleMetadata(article);
}

export default async function ArticlePage({ params }: Props) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const content = await renderArticle(article.content);
  const related = getRelatedArticles(article);
  return (
    <main id="main-content" className="article-page">
      <a href="/blog" className="back-link">← Back to the blog</a>
      <article>
        <header className="article-heading">
          <div className="article-meta"><span>{article.category}</span><span aria-hidden="true">·</span><time dateTime={article.date}>{formatDate(article.date)}</time></div>
          <h1>{article.title}</h1>
          <p className="article-deck">{article.description}</p>
          <p className="byline">By the Pickle team <span aria-hidden="true">·</span> {article.readingMinutes} min read
            {article.updated && <> <span aria-hidden="true">·</span> Updated <time dateTime={article.updated}>{formatDate(article.updated)}</time></>}
          </p>
        </header>
        {article.hero && <figure className="article-hero"><Image src={article.hero} alt={article.heroAlt!} width={article.heroWidth} height={article.heroHeight} priority /><figcaption>{article.heroAlt}</figcaption></figure>}
        <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />
      </article>
      {related.length > 0 && <aside className="related-articles" aria-labelledby="related-title">
        <h2 id="related-title" className="related-heading">A little more to read</h2>
        {related.map((item) => <a key={item.slug} className="related-link" href={`/blog/${item.slug}`}>{item.title} <span aria-hidden="true">↗</span></a>)}
      </aside>}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd(article)) }} />
    </main>
  );
}
