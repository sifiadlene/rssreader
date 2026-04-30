import { useCallback, useEffect, useState } from 'react';
import type { Article } from '../../shared/types/article.js';
import type { Feed } from '../../shared/types/feed.js';
import { getFeed, refreshFeed } from '../services/api.js';

export function useFeed(id: number | null) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    if (id === null) {
      setFeed(null);
      setArticles([]);
      setLoading(false);
      setError('Feed id is invalid.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const detail = await getFeed(id);
      setFeed(detail.feed);
      setArticles(detail.articles);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this feed.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refresh = useCallback(async () => {
    if (id === null) {
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const detail = await refreshFeed(id);
      setFeed(detail.feed);
      setArticles(detail.articles);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh feed.');
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  return {
    feed,
    articles,
    loading,
    refreshing,
    error,
    reload: loadFeed,
    refresh,
  };
}
