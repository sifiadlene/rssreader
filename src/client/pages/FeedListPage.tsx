import { Link } from 'react-router-dom';
import { FeedCard } from '../components/FeedCard.js';
import { useFeeds } from '../hooks/useFeeds.js';

function LoadingGrid() {
  return (
    <div className="skeleton-grid" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="skeleton-card" key={`feed-skeleton-${index}`}>
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

export default function FeedListPage() {
  const { feeds, loading, error, reload } = useFeeds();

  return (
    <section className="page stack-lg">
      <div className="hero-card">
        <div className="page-header">
          <div className="page-header__content">
            <p className="eyebrow">Subscribed feeds</p>
            <h1>Your reading list</h1>
            <p>
              Keep your best sources in one polished dashboard, then open the stories that matter without the clutter.
            </p>
          </div>
          <div className="page-header__actions">
            <Link className="button button--secondary" to="/search">
              Discover feeds
            </Link>
            <button className="button" type="button" onClick={() => void reload()} disabled={loading}>
              {loading ? <span className="button__spinner" aria-hidden="true" /> : null}
              {loading ? 'Refreshing…' : 'Refresh list'}
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="eyebrow">Library</span>
            <strong>{feeds.length}</strong>
            <span>saved feed{feeds.length === 1 ? '' : 's'}</span>
          </div>
          <div className="stat-card">
            <span className="eyebrow">Focus</span>
            <strong>{loading ? '…' : 'Live'}</strong>
            <span>updates ready when you are</span>
          </div>
        </div>
      </div>

      {loading ? <LoadingGrid /> : null}

      {!loading && error ? (
        <div className="status-card status-card--error" role="alert">
          <div className="status-card__icon" aria-hidden="true">
            !
          </div>
          <div className="status-card__content">
            <h2>We couldn&apos;t load your feeds</h2>
            <p>{error}</p>
          </div>
          <button className="button" type="button" onClick={() => void reload()}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error && feeds.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon" aria-hidden="true">
            📡
          </div>
          <div className="empty-state__content">
            <h2>No feeds yet</h2>
            <p>Search for a source and subscribe to start building a clean, personalized reader.</p>
          </div>
          <Link className="button" to="/search">
            Find feeds
          </Link>
        </div>
      ) : null}

      {!loading && !error && feeds.length > 0 ? (
        <div className="stack-md">
          <div className="section-heading">
            <h2>Your subscriptions</h2>
            <span>{feeds.length} source{feeds.length === 1 ? '' : 's'}</span>
          </div>
          <div className="feed-grid">
            {feeds.map((feed) => (
              <FeedCard key={feed.id} feed={feed} unreadCount={0} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
