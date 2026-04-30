import type { Article } from '../../shared/types/article.js';

interface ArticleItemProps {
  article: Article;
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Date unavailable';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ArticleItem({ article }: ArticleItemProps) {
  return (
    <article className={`card article-item article-item--${article.isRead ? 'read' : 'unread'}`}>
      <div className="article-item__meta">
        <span className={`article-item__state article-item__state--${article.isRead ? 'read' : 'unread'}`}>
          {article.isRead ? 'Read' : 'Unread'}
        </span>
        <span>{formatDate(article.pubDate || article.createdAt)}</span>
        {article.author ? <span>{article.author}</span> : null}
      </div>
      <a className="article-item__title-link" href={article.link} target="_blank" rel="noreferrer">
        <h2>{article.title}</h2>
      </a>
      <p className="article-item__excerpt">{article.snippet || 'No summary available for this article.'}</p>
    </article>
  );
}
