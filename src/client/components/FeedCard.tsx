import { Link, useInRouterContext } from 'react-router-dom';
import type { Feed } from '../../shared/types/feed.js';

interface FeedCardProps {
  feed: Feed;
  unreadCount?: number;
}

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

function getFeedInitial(title: string) {
  return title.trim().charAt(0).toUpperCase() || 'R';
}

export function FeedCard({ feed, unreadCount = 0 }: FeedCardProps) {
  const inRouter = useInRouterContext();
  const destination = `/feed/${feed.id}`;
  const sourceLabel = getSourceLabel(feed.siteUrl || feed.url);

  return (
    <article className="card feed-card">
      <div className="feed-card__header">
        <div className="feed-avatar" aria-hidden="true">
          {feed.imageUrl ? <img src={feed.imageUrl} alt="" /> : getFeedInitial(feed.title)}
        </div>
        <div className="feed-card__title-group">
          <p className="card__eyebrow">Subscribed feed</p>
          <h2>{feed.title}</h2>
          <div className="feed-card__meta">
            <span className="meta-pill">{sourceLabel}</span>
            <span className="badge">{unreadCount} article{unreadCount === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      <div className="card__content">
        <p className="feed-card__description">{feed.description || 'No description available for this feed yet.'}</p>
      </div>

      <div className="feed-card__meta">
        <span>Updated feed library</span>
        <div className="feed-card__meta-actions">
          {feed.siteUrl ? (
            <a className="text-link" href={feed.siteUrl} target="_blank" rel="noreferrer">
              Open site
            </a>
          ) : null}
          {inRouter ? (
            <Link className="button button--secondary" to={destination}>
              View feed
            </Link>
          ) : (
            <a className="button button--secondary" href={destination}>
              View feed
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
