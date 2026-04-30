import type { Feed } from '../../shared/types/feed.js';
import db from './database.js';

interface FeedRow {
  id: number;
  title: string;
  url: string;
  description: string | null;
  site_url: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedCreateInput {
  title?: string;
  url: string;
  description?: string | null;
  siteUrl?: string | null;
  imageUrl?: string | null;
}

export interface FeedUpdateInput {
  title?: string;
  url?: string;
  description?: string | null;
  siteUrl?: string | null;
  imageUrl?: string | null;
}

const mapFeedRow = (row: FeedRow): Feed => ({
  id: row.id,
  title: row.title,
  url: row.url,
  description: row.description,
  siteUrl: row.site_url,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listFeedsStatement = db.prepare('SELECT * FROM feeds ORDER BY created_at DESC, id DESC');
const getFeedByIdStatement = db.prepare('SELECT * FROM feeds WHERE id = ?');
const getFeedByUrlStatement = db.prepare('SELECT * FROM feeds WHERE url = ?');
const insertFeedStatement = db.prepare(`
  INSERT INTO feeds (title, url, description, site_url, image_url)
  VALUES (?, ?, ?, ?, ?)
`);
const updateFeedStatement = db.prepare(`
  UPDATE feeds
  SET title = ?,
      url = ?,
      description = ?,
      site_url = ?,
      image_url = ?,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);
const deleteFeedStatement = db.prepare('DELETE FROM feeds WHERE id = ?');

export const listFeeds = (): Feed[] => listFeedsStatement.all().map((row) => mapFeedRow(row as FeedRow));

export const getFeeds = (): Feed[] => listFeeds();

export const getFeedById = (id: number): Feed | null => {
  const row = getFeedByIdStatement.get(id) as FeedRow | undefined;
  return row ? mapFeedRow(row) : null;
};

export const getFeedByUrl = (url: string): Feed | null => {
  const row = getFeedByUrlStatement.get(url) as FeedRow | undefined;
  return row ? mapFeedRow(row) : null;
};

export const createFeed = (input: FeedCreateInput): Feed => {
  const result = insertFeedStatement.run(
    input.title ?? input.url,
    input.url,
    input.description ?? null,
    input.siteUrl ?? null,
    input.imageUrl ?? null,
  );

  return getFeedById(Number(result.lastInsertRowid)) as Feed;
};

export const updateFeed = (id: number, input: FeedUpdateInput): Feed | null => {
  const existingFeed = getFeedById(id);
  if (!existingFeed) {
    return null;
  }

  const result = updateFeedStatement.run(
    input.title ?? existingFeed.title,
    input.url ?? existingFeed.url,
    input.description ?? existingFeed.description,
    input.siteUrl ?? existingFeed.siteUrl,
    input.imageUrl ?? existingFeed.imageUrl,
    id,
  );

  if (result.changes === 0) {
    return existingFeed;
  }

  return getFeedById(id);
};

export const deleteFeed = (id: number): boolean => deleteFeedStatement.run(id).changes > 0;
