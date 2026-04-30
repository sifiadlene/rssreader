import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readArticle, sampleArticle, sampleFeed, sampleFeedInput } from '../../test/fixtures';

type FeedRecord = typeof sampleFeed;
type ArticleRecord = typeof sampleArticle;

type FeedModelModule = {
  createFeed: (input: { title: string; url: string; description?: string | null; siteUrl?: string | null; imageUrl?: string | null }) => FeedRecord;
  deleteFeed: (id: number) => boolean;
};

type ArticleModelModule = {
  createArticle: (input: Omit<ArticleRecord, 'id' | 'createdAt'>) => ArticleRecord;
  getArticleById: (id: number) => ArticleRecord | null;
  listArticlesByFeedId: (feedId: number) => ArticleRecord[];
  markArticleAsRead: (id: number) => ArticleRecord | null;
};

async function loadModels() {
  vi.resetModules();
  process.env.DATABASE_PATH = ':memory:';

  try {
    const [feedModel, articleModel] = await Promise.all([
      import('../models/feedModel.js'),
      import('../models/articleModel.js'),
    ]);

    return {
      feedModel: feedModel as FeedModelModule,
      articleModel: articleModel as ArticleModelModule,
    };
  } catch (error) {
    throw new Error(`Expected src/server/models/articleModel.ts to exist for CRUD tests. ${(error as Error).message}`);
  }
}

describe('articleModel contract', () => {
  let feedModel: FeedModelModule;
  let articleModel: ArticleModelModule;
  let createdFeed: FeedRecord;

  beforeEach(async () => {
    const modules = await loadModels();
    feedModel = modules.feedModel;
    articleModel = modules.articleModel;
    createdFeed = feedModel.createFeed({
      ...sampleFeedInput,
      title: sampleFeed.title,
      description: sampleFeed.description,
      siteUrl: sampleFeed.siteUrl,
      imageUrl: sampleFeed.imageUrl,
    });
  });

  it('creates and lists articles for a feed', () => {
    const created = articleModel.createArticle({
      feedId: createdFeed.id,
      title: sampleArticle.title,
      link: sampleArticle.link,
      snippet: sampleArticle.snippet,
      author: sampleArticle.author,
      pubDate: sampleArticle.pubDate,
      guid: sampleArticle.guid,
      isRead: sampleArticle.isRead,
    });

    expect(created).toMatchObject({
      id: expect.any(Number),
      feedId: createdFeed.id,
      title: sampleArticle.title,
      link: sampleArticle.link,
      guid: sampleArticle.guid,
      isRead: false,
    });

    expect(articleModel.listArticlesByFeedId(createdFeed.id)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          feedId: createdFeed.id,
          title: sampleArticle.title,
        }),
      ]),
    );
  });

  it('gets an article by id', () => {
    const created = articleModel.createArticle({
      feedId: createdFeed.id,
      title: sampleArticle.title,
      link: sampleArticle.link,
      snippet: sampleArticle.snippet,
      author: sampleArticle.author,
      pubDate: sampleArticle.pubDate,
      guid: sampleArticle.guid,
      isRead: sampleArticle.isRead,
    });

    expect(articleModel.getArticleById(created.id)).toEqual(expect.objectContaining({ id: created.id, guid: sampleArticle.guid }));
  });

  it('marks an article as read', () => {
    const created = articleModel.createArticle({
      feedId: createdFeed.id,
      title: sampleArticle.title,
      link: sampleArticle.link,
      snippet: sampleArticle.snippet,
      author: sampleArticle.author,
      pubDate: sampleArticle.pubDate,
      guid: sampleArticle.guid,
      isRead: sampleArticle.isRead,
    });

    const updated = articleModel.markArticleAsRead(created.id);

    expect(updated).toEqual(expect.objectContaining({ id: created.id, isRead: readArticle.isRead }));
  });

  it('removes a feed\'s articles when the parent feed is deleted', () => {
    articleModel.createArticle({
      feedId: createdFeed.id,
      title: sampleArticle.title,
      link: sampleArticle.link,
      snippet: sampleArticle.snippet,
      author: sampleArticle.author,
      pubDate: sampleArticle.pubDate,
      guid: sampleArticle.guid,
      isRead: sampleArticle.isRead,
    });

    expect(feedModel.deleteFeed(createdFeed.id)).toBe(true);
    expect(articleModel.listArticlesByFeedId(createdFeed.id)).toEqual([]);
  });
});
