import type { SearchResult } from '../../shared/types/api.js';

interface FeedPreviewProps {
  feed: SearchResult;
  onSubscribe: (url: string) => void;
  isSubscribing?: boolean;
}

function getSourceLabel(url: string | null) {
  if (!url) {
    return 'Discovered source';
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

export function FeedPreview({ feed, onSubscribe, isSubscribing = false }: FeedPreviewProps) {
  const sourceLabel = getSourceLabel(feed.siteUrl || feed.url);

  return (
    <article className="card feed-preview">
      <div className="feed-preview__header">
        <div className="feed-preview__avatar" aria-hidden="true">
          {feed.imageUrl ? <img src={feed.imageUrl} alt="" /> : getFeedInitial(feed.title)}
        </div>
        <div className="feed-preview__title-group">
          <p className="card__eyebrow">Search result</p>
          <h3>{feed.title}</h3>
          <div className="feed-preview__meta">
            <span className="meta-pill">{sourceLabel}</span>
            <span className="badge badge--accent">Ready to subscribe</span>
          </div>
        </div>
      </div>

      <div className="card__content">
        <p className="feed-preview__description">{feed.description || 'No description provided by this source.'}</p>
      </div>

      <div className="feed-preview__actions">
        {feed.siteUrl ? (
          <a className="text-link" href={feed.siteUrl} target="_blank" rel="noreferrer">
            Visit site
          </a>
        ) : (
          <span className="surface-chip">RSS source</span>
        )}
        <button className="button" type="button" onClick={() => onSubscribe(feed.url)} disabled={isSubscribing}>
          {isSubscribing ? <span className="button__spinner" aria-hidden="true" /> : null}
          {isSubscribing ? 'Adding…' : 'Subscribe'}
        </button>
      </div>
    </article>
  );
}
