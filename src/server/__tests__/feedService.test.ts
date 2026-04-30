import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sampleArticle, sampleFeed, sampleParsedFeed } from '../../test/fixtures';

describe('feedService contract', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('parses a feed with rss-parser and maps metadata plus articles', async () => {
    const parserParseURL = vi.fn().mockResolvedValue(sampleParsedFeed);

    vi.doMock('rss-parser', () => ({
      default: class Parser {
        parseURL = parserParseURL;
      },
    }));

    const feedService = await import('../services/feedService.js').catch((error) => {
      throw new Error(`Expected src/server/services/feedService.ts to exist. ${(error as Error).message}`);
    });

    const parsed = await feedService.parseFeed(sampleFeed.url);

    expect(parserParseURL).toHaveBeenCalledWith(sampleFeed.url);
    expect(parsed).toEqual(
      expect.objectContaining({
        title: sampleFeed.title,
        url: sampleFeed.url,
        description: sampleFeed.description,
        siteUrl: sampleFeed.siteUrl,
        imageUrl: sampleFeed.imageUrl,
        articles: expect.arrayContaining([
          expect.objectContaining({
            title: sampleArticle.title,
            link: sampleArticle.link,
            guid: sampleArticle.guid,
          }),
        ]),
      }),
    );
  });

  it('searches feeds through the discovery service', async () => {
    const discoverFeeds = vi.fn().mockResolvedValue([
      {
        title: sampleFeed.title,
        url: sampleFeed.url,
        description: sampleFeed.description,
        siteUrl: sampleFeed.siteUrl,
        imageUrl: sampleFeed.imageUrl,
      },
    ]);

    vi.doMock('../services/feedDiscoveryService.js', () => ({
      discoverFeeds,
    }));

    const feedService = await import('../services/feedService.js').catch((error) => {
      throw new Error(`Expected src/server/services/feedService.ts to exist. ${(error as Error).message}`);
    });

    const results = await feedService.searchFeeds(sampleFeed.url);

    expect(discoverFeeds).toHaveBeenCalledWith(sampleFeed.url);
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: sampleFeed.title,
          url: sampleFeed.url,
          description: sampleFeed.description,
          siteUrl: sampleFeed.siteUrl,
        }),
      ]),
    );
  });

  it('refreshes a stored feed and returns feed metadata, articles, and a refreshed count', async () => {
    const parserParseURL = vi.fn().mockResolvedValue(sampleParsedFeed);
    const getFeedById = vi.fn().mockReturnValue(sampleFeed);
    const updateFeed = vi.fn().mockReturnValue(sampleFeed);
    const upsertArticles = vi.fn().mockReturnValue(1);
    const listArticlesByFeedId = vi.fn().mockReturnValue([sampleArticle]);
    const getArticlesByFeedId = vi.fn().mockReturnValue([sampleArticle]);

    vi.doMock('rss-parser', () => ({
      default: class Parser {
        parseURL = parserParseURL;
      },
    }));

    vi.doMock('../models/feedModel.js', () => ({
      getFeedById,
      updateFeed,
      getFeedByUrl: vi.fn(),
      createFeed: vi.fn(),
    }));

    vi.doMock('../models/articleModel.js', () => ({
      upsertArticles,
      listArticlesByFeedId,
      getArticlesByFeedId,
    }));

    const feedService = await import('../services/feedService.js').catch((error) => {
      throw new Error(`Expected src/server/services/feedService.ts to exist. ${(error as Error).message}`);
    });

    const refreshed = await feedService.refreshFeed(sampleFeed.id);

    expect(getFeedById).toHaveBeenCalledWith(sampleFeed.id);
    expect(parserParseURL).toHaveBeenCalledWith(sampleFeed.url);
    expect(updateFeed).toHaveBeenCalledWith(
      sampleFeed.id,
      expect.objectContaining({
        title: sampleFeed.title,
        url: sampleFeed.url,
      }),
    );
    expect(upsertArticles).toHaveBeenCalled();
    expect(getArticlesByFeedId.mock.calls.length + listArticlesByFeedId.mock.calls.length).toBeGreaterThan(0);
    expect(refreshed).toEqual(
      expect.objectContaining({
        id: sampleFeed.id,
        title: sampleFeed.title,
        articles: expect.arrayContaining([expect.objectContaining({ guid: sampleArticle.guid })]),
        refreshedCount: 1,
      }),
    );
  });
});
