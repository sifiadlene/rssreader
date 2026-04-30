import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('database models', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.DATABASE_PATH = ':memory:';
  });

  afterEach(() => {
    delete process.env.DATABASE_PATH;
    vi.resetModules();
  });

  it('creates, reads, updates, and deletes feeds and articles', async () => {
    const feedModel = await import('./feedModel.js');
    const articleModel = await import('./articleModel.js');

    const feed = feedModel.createFeed({
      title: 'Example Feed',
      url: 'https://example.com/feed.xml',
      description: 'Example description',
      siteUrl: 'https://example.com',
      imageUrl: 'https://example.com/logo.png',
    });

    expect(feedModel.listFeeds()).toHaveLength(1);

    const insertedCount = articleModel.upsertArticles([
      {
        feedId: feed.id,
        title: 'First article',
        link: 'https://example.com/articles/1',
        guid: 'article-1',
        snippet: 'Hello world',
      },
    ]);

    expect(insertedCount).toBe(1);

    const articles = articleModel.listArticlesByFeedId(feed.id);
    expect(articles).toHaveLength(1);
    expect(articles[0]?.isRead).toBe(false);

    const marked = articleModel.markArticleAsRead(articles[0]!.id);
    expect(marked?.isRead).toBe(true);

    const updatedFeed = feedModel.updateFeed(feed.id, {
      title: 'Updated Feed',
      url: feed.url,
      description: 'Updated description',
      siteUrl: feed.siteUrl,
      imageUrl: feed.imageUrl,
    });

    expect(updatedFeed?.title).toBe('Updated Feed');
    expect(feedModel.deleteFeed(feed.id)).toBe(true);
    expect(feedModel.listFeeds()).toHaveLength(0);
  });
});
