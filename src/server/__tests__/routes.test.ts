import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sampleArticle, sampleFeed, sampleSearchResult } from '../../test/fixtures';

async function loadApp() {
  vi.resetModules();

  const getFeeds = vi.fn().mockReturnValue([]);
  const createFeed = vi.fn().mockReturnValue(sampleFeed);
  const getFeedById = vi.fn().mockReturnValue(sampleFeed);
  const deleteFeed = vi.fn().mockReturnValue(true);
  const getArticles = vi.fn().mockReturnValue([sampleArticle]);
  const searchFeeds = vi.fn().mockResolvedValue([sampleSearchResult]);
  const subscribeToFeed = vi.fn().mockResolvedValue(sampleFeed);
  const refreshFeed = vi.fn().mockResolvedValue({
    ...sampleFeed,
    articles: [sampleArticle],
    refreshedCount: 1,
  });

  vi.doMock('../models/feedModel.js', () => ({
    getFeeds,
    createFeed,
    getFeedById,
    deleteFeed,
  }));

  vi.doMock('../services/articleService.js', () => ({
    getArticles,
  }));

  vi.doMock('../services/feedService.js', () => ({
    searchFeeds,
    subscribeToFeed,
    refreshFeed,
  }));

  const appModule = await import('../app.ts').catch((error) => {
    throw new Error(`Expected src/server/app.ts to exist. ${(error as Error).message}`);
  });

  return {
    app: appModule.app ?? appModule.default,
    mocks: { getFeeds, createFeed, getFeedById, deleteFeed, getArticles, searchFeeds, subscribeToFeed, refreshFeed },
  };
}

describe('API routes contract', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('GET /api/feeds returns an empty array initially', async () => {
    const { app, mocks } = await loadApp();
    const response = await request(app).get('/api/feeds');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(mocks.getFeeds).toHaveBeenCalled();
  });

  it('POST /api/feeds creates a feed', async () => {
    const { app, mocks } = await loadApp();
    const response = await request(app).post('/api/feeds').send({ url: sampleFeed.url });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: sampleFeed.id,
        title: sampleFeed.title,
        url: sampleFeed.url,
        articles: expect.arrayContaining([expect.objectContaining({ guid: sampleArticle.guid })]),
      }),
    );
    expect(mocks.subscribeToFeed).toHaveBeenCalledWith(sampleFeed.url);
  });

  it('GET /api/feeds/:id returns feed with articles', async () => {
    const { app, mocks } = await loadApp();
    const response = await request(app).get(`/api/feeds/${sampleFeed.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: sampleFeed.id,
        title: sampleFeed.title,
        articles: expect.arrayContaining([expect.objectContaining({ guid: sampleArticle.guid })]),
      }),
    );
    expect(mocks.getFeedById).toHaveBeenCalledWith(sampleFeed.id);
    expect(mocks.getArticles).toHaveBeenCalledWith(sampleFeed.id);
  });

  it('DELETE /api/feeds/:id removes feed', async () => {
    const { app, mocks } = await loadApp();
    const response = await request(app).delete(`/api/feeds/${sampleFeed.id}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
    expect(mocks.deleteFeed).toHaveBeenCalledWith(sampleFeed.id);
  });

  it('GET /api/search?q= returns results', async () => {
    const { app, mocks } = await loadApp();
    const response = await request(app).get('/api/search').query({ q: 'rss reader' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([expect.objectContaining(sampleSearchResult)]);
    expect(mocks.searchFeeds).toHaveBeenCalledWith('rss reader');
  });

  it('POST /api/feeds/:id/refresh returns refreshed articles', async () => {
    const { app, mocks } = await loadApp();
    const response = await request(app).post(`/api/feeds/${sampleFeed.id}/refresh`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: sampleFeed.id,
        articles: expect.arrayContaining([expect.objectContaining({ guid: sampleArticle.guid })]),
        refreshedCount: 1,
      }),
    );
    expect(mocks.refreshFeed).toHaveBeenCalledWith(sampleFeed.id);
  });
});
