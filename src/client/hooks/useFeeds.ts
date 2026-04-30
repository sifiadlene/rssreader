import { useCallback, useEffect, useState } from 'react';
import type { Feed } from '../../shared/types/feed.js';
import { deleteFeed, getFeeds } from '../services/api.js';

export function useFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeeds = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setFeeds(await getFeeds());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load feeds.');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFeed = useCallback(async (id: number) => {
    await deleteFeed(id);
    setFeeds((currentFeeds) => currentFeeds.filter((feed) => feed.id !== id));
  }, []);

  useEffect(() => {
    void loadFeeds();
  }, [loadFeeds]);

  return {
    feeds,
    loading,
    error,
    reload: loadFeeds,
    removeFeed,
  };
}
