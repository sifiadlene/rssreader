import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sampleArticle, sampleFeed, sampleSearchResult } from '../../test/fixtures';

type ApiModule = {
  getFeeds: () => Promise<unknown>;
  addFeed: (url: string) => Promise<unknown>;
  getFeed: (id: number) => Promise<unknown>;
  deleteFeed: (id: number) => Promise<unknown>;
  searchFeeds: (query: string) => Promise<unknown>;
  refreshFeed: (id: number) => Promise<unknown>;
};

async function loadApiModule(): Promise<ApiModule> {
  vi.resetModules();

  try {
    return (await import('../services/api.ts')) as ApiModule;
  } catch (error) {
    throw new Error(`Expected src/client/services/api.ts to exist for API client tests. ${(error as Error).message}`);
  }
}

function createJsonResponse(payload: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    text: async () => JSON.stringify(payload),
  };
}

describe('client API contract', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('getFeeds requests /api/feeds and unwraps the feed list response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ feeds: [sampleFeed] }));
    vi.stubGlobal('fetch', fetchMock);

    const api = await loadApiModule();
    const feeds = await api.getFeeds();

    expect(fetchMock).toHaveBeenCalledWith('/api/feeds', expect.any(Object));
    expect(feeds).toEqual([expect.objectContaining({ id: sampleFeed.id, title: sampleFeed.title })]);
  });

  it('addFeed posts a url and normalizes the nested feed response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        feed: sampleFeed,
        articles: [sampleArticle],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const api = await loadApiModule();
    const created = await api.addFeed(sampleFeed.url);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/feeds',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ url: sampleFeed.url }),
      }),
    );
    expect(created).toEqual(
      expect.objectContaining({
        feed: expect.objectContaining({ id: sampleFeed.id, url: sampleFeed.url }),
        articles: expect.arrayContaining([expect.objectContaining({ guid: sampleArticle.guid })]),
      }),
    );
  });

  it('getFeed loads a single feed and its articles', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        feed: sampleFeed,
        articles: [sampleArticle],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const api = await loadApiModule();
    const feed = await api.getFeed(sampleFeed.id);

    expect(fetchMock).toHaveBeenCalledWith(`/api/feeds/${sampleFeed.id}`, expect.any(Object));
    expect(feed).toEqual(
      expect.objectContaining({
        feed: expect.objectContaining({ id: sampleFeed.id }),
        articles: expect.arrayContaining([expect.objectContaining({ guid: sampleArticle.guid })]),
      }),
    );
  });

  it('deleteFeed sends a DELETE request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);

    const api = await loadApiModule();
    await api.deleteFeed(sampleFeed.id);

    expect(fetchMock).toHaveBeenCalledWith(`/api/feeds/${sampleFeed.id}`, expect.objectContaining({ method: 'DELETE' }));
  });

  it('searchFeeds requests /api/search with the provided query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ results: [sampleSearchResult] }));
    vi.stubGlobal('fetch', fetchMock);

    const api = await loadApiModule();
    const results = await api.searchFeeds('rss reader');

    expect(fetchMock).toHaveBeenCalledWith('/api/search?q=rss+reader', expect.any(Object));
    expect(results).toEqual([expect.objectContaining({ title: sampleSearchResult.title, url: sampleSearchResult.url })]);
  });

  it('refreshFeed posts to the refresh endpoint and returns articles', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        feed: sampleFeed,
        articles: [sampleArticle],
        refreshedCount: 1,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const api = await loadApiModule();
    const refreshed = await api.refreshFeed(sampleFeed.id);

    expect(fetchMock).toHaveBeenCalledWith(`/api/feeds/${sampleFeed.id}/refresh`, expect.objectContaining({ method: 'POST' }));
    expect(refreshed).toEqual(
      expect.objectContaining({
        feed: expect.objectContaining({ id: sampleFeed.id }),
        articles: expect.arrayContaining([expect.objectContaining({ guid: sampleArticle.guid })]),
        refreshedCount: 1,
      }),
    );
  });
});
