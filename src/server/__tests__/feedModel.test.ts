import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sampleFeed, sampleFeedInput, updatedFeed } from '../../test/fixtures';

type FeedRecord = typeof sampleFeed;

type FeedModelModule = {
  createFeed: (input: { title: string; url: string; description?: string | null; siteUrl?: string | null; imageUrl?: string | null }) => FeedRecord;
  listFeeds: () => FeedRecord[];
  getFeedById: (id: number) => FeedRecord | null;
  updateFeed: (id: number, updates: { title: string; url: string; description?: string | null; siteUrl?: string | null; imageUrl?: string | null }) => FeedRecord | null;
  deleteFeed: (id: number) => boolean;
};

async function loadFeedModel(): Promise<FeedModelModule> {
  vi.resetModules();
  process.env.DATABASE_PATH = ':memory:';

  try {
    return (await import('../models/feedModel.js')) as FeedModelModule;
  } catch (error) {
    throw new Error(`Expected src/server/models/feedModel.ts to exist for CRUD tests. ${(error as Error).message}`);
  }
}

describe('feedModel contract', () => {
  let feedModel: FeedModelModule;

  beforeEach(async () => {
    feedModel = await loadFeedModel();
  });

  it('creates and lists feeds', () => {
    const created = feedModel.createFeed({
      ...sampleFeedInput,
      title: sampleFeed.title,
      description: sampleFeed.description,
      siteUrl: sampleFeed.siteUrl,
      imageUrl: sampleFeed.imageUrl,
    });

    expect(created).toMatchObject({
      id: expect.any(Number),
      title: sampleFeed.title,
      url: sampleFeed.url,
      description: sampleFeed.description,
      siteUrl: sampleFeed.siteUrl,
      imageUrl: sampleFeed.imageUrl,
    });

    expect(feedModel.listFeeds()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          title: sampleFeed.title,
          url: sampleFeed.url,
        }),
      ]),
    );
  });

  it('gets a feed by id', () => {
    const created = feedModel.createFeed({
      ...sampleFeedInput,
      title: sampleFeed.title,
      description: sampleFeed.description,
      siteUrl: sampleFeed.siteUrl,
      imageUrl: sampleFeed.imageUrl,
    });

    expect(feedModel.getFeedById(created.id)).toEqual(expect.objectContaining({ id: created.id, url: sampleFeed.url }));
  });

  it('updates a stored feed', () => {
    const created = feedModel.createFeed({
      ...sampleFeedInput,
      title: sampleFeed.title,
      description: sampleFeed.description,
      siteUrl: sampleFeed.siteUrl,
      imageUrl: sampleFeed.imageUrl,
    });

    const updated = feedModel.updateFeed(created.id, {
      title: updatedFeed.title,
      url: created.url,
      description: updatedFeed.description,
      siteUrl: created.siteUrl,
      imageUrl: created.imageUrl,
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id: created.id,
        title: updatedFeed.title,
        description: updatedFeed.description,
      }),
    );
  });

  it('deletes a feed', () => {
    const created = feedModel.createFeed({
      ...sampleFeedInput,
      title: sampleFeed.title,
      description: sampleFeed.description,
      siteUrl: sampleFeed.siteUrl,
      imageUrl: sampleFeed.imageUrl,
    });

    expect(feedModel.deleteFeed(created.id)).toBe(true);
    expect(feedModel.getFeedById(created.id)).toBeNull();
  });
});
