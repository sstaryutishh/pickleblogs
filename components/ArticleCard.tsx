import Image from "next/image";
import type { Article } from "@/lib/articles";
import { formatDate } from "@/lib/site";

export function ArticleCard({ article, priority = false }: { article: Article; priority?: boolean }) {
  return (
    <article className="article-card">
      <a className="article-card-link" href={`/blog/${article.slug}`} aria-labelledby={`title-${article.slug}`}>
        <Image className="article-thumbnail" src={article.image} alt={article.imageAlt}
          width={100} height={72} priority={priority} />
        <div className="article-preview">
          <div className="article-meta">
            <span>{article.category}</span><span aria-hidden="true">·</span>
            <time dateTime={article.date}>{formatDate(article.date)}</time>
          </div>
          <h2 id={`title-${article.slug}`}>{article.title}</h2>
          <p className="article-excerpt">{article.excerpt}</p>
        </div>
      </a>
    </article>
  );
}
