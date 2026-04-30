import { useCallback, useMemo, useState } from 'react';
import type { SearchResult } from '../../shared/types/api.js';
import { addFeed, searchFeeds } from '../services/api.js';

const looksLikeUrl = (value: string): boolean => {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || (!trimmed.includes(' ') && /[./:]/.test(trimmed));
};

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [subscribingUrl, setSubscribingUrl] = useState<string | null>(null);
  const loadingMessage = useMemo(
    () => (looksLikeUrl(query) ? 'Discovering feeds from this website…' : 'Searching the web for RSS feeds…'),
    [query],
  );

  const search = useCallback(async (term: string) => {
    const normalizedTerm = term.trim();
    setQuery(term);
    setHasSearched(true);
    setFeedback(null);

    if (!normalizedTerm) {
      setResults([]);
      setError('Enter a keyword or RSS URL to search.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setResults(await searchFeeds(normalizedTerm));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Search failed.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribe = useCallback(async (url: string) => {
    setSubscribingUrl(url);
    setError(null);
    setFeedback(null);

    try {
      await addFeed(url);
      setFeedback('Feed subscribed successfully.');
      setResults((currentResults) => currentResults.filter((feed) => feed.url !== url));
    } catch (subscribeError) {
      setError(subscribeError instanceof Error ? subscribeError.message : 'Unable to subscribe to feed.');
    } finally {
      setSubscribingUrl(null);
    }
  }, []);

  return {
    query,
    results,
    loading,
    hasSearched,
    error,
    feedback,
    subscribingUrl,
    loadingMessage,
    setQuery,
    search,
    subscribe,
  };
}
