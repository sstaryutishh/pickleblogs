import { ArticleCard } from "./ArticleCard";
import { getArticlePage, getPageCount } from "@/lib/articles";
import { pagePath } from "@/lib/site";
import { notFound } from "next/navigation";

export function BlogIndex({ page = 1 }: { page?: number }) {
  const articles = getArticlePage(page);
  if (!articles) notFound();
  const pages = getPageCount();
  return (
    <main id="main-content" className="blog-index">
      <h1 className="sr-only">The Pickle Blog{page > 1 ? ` — Page ${page}` : ""}</h1>
      {page > 1 && <div className="archive-label"><a href="/blog">All stories</a><span>Page {page} of {pages}</span></div>}
      <div className="article-list">
        {articles.map((article, index) => <ArticleCard key={article.slug} article={article} priority={index === 0} />)}
      </div>
      <nav className="pagination" aria-label="Blog pagination">
        {page > 1 && <a className="previous-page" href={pagePath(page - 1)} rel="prev">← Newer stories</a>}
        {page < pages && <a className="read-more" href={pagePath(page + 1)} rel="next">Read More<span className="sr-only"> — page {page + 1}</span></a>}
      </nav>
    </main>
  );
}
