import { Link, useParams } from 'react-router-dom';
import { ArticleItem } from '../components/ArticleItem.js';
import { useFeed } from '../hooks/useFeed.js';

function getSourceLabel(url: string | null) {
  if (!url) {
    return 'Saved source';
  }

  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getFeedInitial(title: string | undefined) {
  return title?.trim().charAt(0).toUpperCase() || 'R';
}

function LoadingArticles() {
  return (
    <div className="skeleton-grid" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="skeleton-card" key={`article-skeleton-${index}`}>
          <div className="skeleton-card__content">
            <div className="skeleton-line skeleton-line--short" />
            <div className="skeleton-line skeleton-line--medium" />
            <div className="skeleton-line skeleton-line--long" />
            <div className="skeleton-line skeleton-line--long" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeedDetailPage() {
  const params = useParams();
  const feedId = Number(params.id);
  const validFeedId = Number.isFinite(feedId) ? feedId : null;
  const { feed, articles, loading, refreshing, error, reload, refresh } = useFeed(validFeedId);

  if (validFeedId === null) {
    return (
      <section className="page">
        <div className="empty-state">
          <div className="empty-state__icon" aria-hidden="true">
            ⚠️
          </div>
          <div className="empty-state__content">
            <h2>Invalid feed link</h2>
            <p>This feed id is invalid. Return to your library and open a saved source instead.</p>
          </div>
          <Link className="button" to="/">
            Back home
          </Link>
        </div>
      </section>
    );
  }

  const sourceLabel = getSourceLabel(feed?.siteUrl || feed?.url || null);

  return (
    <section className="page stack-lg">
      <div className="feed-detail">
        <div className="feed-detail__content">
          <div className="feed-detail__header">
            <div className="feed-detail__avatar" aria-hidden="true">
              {feed?.imageUrl ? <img src={feed.imageUrl} alt="" /> : getFeedInitial(feed?.title)}
            </div>
            <div className="feed-detail__title-group">
              <p className="eyebrow">Feed detail</p>
              <h1>{feed?.title || 'Loading feed…'}</h1>
              <p className="feed-detail__description">
                {feed?.description || 'Browse the latest articles available for this feed.'}
              </p>
            </div>
          </div>

          <div className="feed-detail__meta">
            <span className="meta-pill">{sourceLabel}</span>
            <span className="badge">{articles.length} article{articles.length === 1 ? '' : 's'}</span>
            {refreshing ? <span className="surface-chip">Refreshing articles…</span> : null}
          </div>

          <div className="feed-detail__actions">
            <Link className="button button--secondary" to="/">
              Back home
            </Link>
            {feed?.siteUrl ? (
              <a className="button button--secondary" href={feed.siteUrl} target="_blank" rel="noreferrer">
                Visit source
              </a>
            ) : null}
            <button className="button" type="button" onClick={() => void refresh()} disabled={loading || refreshing}>
              {refreshing ? <span className="button__spinner" aria-hidden="true" /> : null}
              {refreshing ? 'Refreshing…' : 'Refresh feed'}
            </button>
          </div>
        </div>
      </div>

      {loading ? <LoadingArticles /> : null}

      {!loading && error ? (
        <div className="status-card status-card--error" role="alert">
          <div className="status-card__icon" aria-hidden="true">
            !
          </div>
          <div className="status-card__content">
            <h2>Feed unavailable</h2>
            <p>{error}</p>
          </div>
          <button className="button" type="button" onClick={() => void reload()}>
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && articles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon" aria-hidden="true">
            📰
          </div>
          <div className="empty-state__content">
            <h2>No articles yet</h2>
            <p>Refresh this feed to pull in the latest posts and fill your reading queue.</p>
          </div>
          <button className="button" type="button" onClick={() => void refresh()} disabled={refreshing}>
            {refreshing ? <span className="button__spinner" aria-hidden="true" /> : null}
            {refreshing ? 'Refreshing…' : 'Refresh feed'}
          </button>
        </div>
      ) : null}

      {!loading && !error && articles.length > 0 ? (
        <div className="stack-md">
          <div className="section-heading">
            <h2>Latest articles</h2>
            <span>{articles.length} item{articles.length === 1 ? '' : 's'}</span>
          </div>
          <div className="article-list">
            {articles.map((article) => (
              <ArticleItem key={`${article.id}-${article.link}`} article={article} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
