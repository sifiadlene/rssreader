import type { SearchResult } from '../../shared/types/api.js';
import { FeedPreview } from './FeedPreview.js';

interface SearchResultsProps {
  results: SearchResult[];
  hasSearched: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  subscribingUrl?: string | null;
  onSubscribe: (url: string) => void;
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="stack-md" aria-live="polite" aria-busy="true">
      <div className="section-heading">
        <h2>Searching feeds</h2>
        <span>{message}</span>
      </div>
      <div className="skeleton-grid" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="skeleton-card" key={`search-skeleton-${index}`}>
            <div className="skeleton-card__content">
              <div className="skeleton-line skeleton-line--short" />
              <div className="skeleton-line skeleton-line--medium" />
              <div className="skeleton-line skeleton-line--long" />
              <div className="skeleton-line skeleton-line--long" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchResults({
  results,
  hasSearched,
  isLoading = false,
  loadingMessage = 'Searching the web for RSS feeds…',
  subscribingUrl = null,
  onSubscribe,
}: SearchResultsProps) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (!hasSearched) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon" aria-hidden="true">
          ✨
        </div>
        <div className="empty-state__content">
          <h2>Discover your next favorite feed</h2>
          <p>Search by topic, publication, or paste a website or RSS URL to preview sources before subscribing.</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon" aria-hidden="true">
          🔎
        </div>
        <div className="empty-state__content">
          <h2>No feeds matched this search</h2>
          <p>Try a broader keyword, another site URL, or paste the direct RSS feed URL instead.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <div className="section-heading">
        <h2>Search results</h2>
        <span>{results.length} found</span>
      </div>
      <div className="feed-grid">
        {results.map((feed) => (
          <FeedPreview
            key={feed.url}
            feed={feed}
            onSubscribe={onSubscribe}
            isSubscribing={subscribingUrl === feed.url}
          />
        ))}
      </div>
    </div>
  );
}
