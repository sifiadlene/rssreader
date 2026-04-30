import Parser from 'rss-parser';
import type { SearchResult } from '../../shared/types/api.js';
import { discoverFeeds } from './feedDiscoveryService.js';
import type { Article } from '../../shared/types/article.js';
import type { Feed } from '../../shared/types/feed.js';
import { AppError } from '../middleware/errorHandler.js';
import * as articleModel from '../models/articleModel.js';
import type { ArticleCreateInput } from '../models/articleModel.js';
import * as feedModel from '../models/feedModel.js';

interface ParsedFeedResult {
  title: string;
  url: string;
  description: string | null;
  siteUrl: string | null;
  imageUrl: string | null;
  articles: ArticleCreateInput[];
}

const parser = new Parser();

const toTrimmedString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toIsoDate = (value: unknown): string | null => {
  const raw = toTrimmedString(value);
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const normalizeUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new AppError(400, 'Feed URL is required', 'INVALID_FEED_URL');
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return new URL(`https://${trimmed}`).toString();
  }
};

const extractFeedImageUrl = (feed: Record<string, unknown>): string | null => {
  const image = feed.image as { url?: unknown } | undefined;
  if (image?.url) {
    return toTrimmedString(image.url);
  }

  const itunes = feed.itunes as { image?: unknown } | undefined;
  return itunes?.image ? toTrimmedString(itunes.image) : null;
};

const buildArticleRecords = (items: unknown[], feedId = 0): ArticleCreateInput[] =>
  items.reduce<ArticleCreateInput[]>((records, item) => {
    const record = item as Record<string, unknown>;
    const link = toTrimmedString(record.link) ?? toTrimmedString(record.guid) ?? toTrimmedString(record.id);
    const guid = toTrimmedString(record.guid) ?? toTrimmedString(record.id) ?? link;

    if (!link || !guid) {
      return records;
    }

    records.push({
      feedId,
      title: toTrimmedString(record.title) ?? 'Untitled article',
      link,
      snippet:
        toTrimmedString(record.contentSnippet) ??
        toTrimmedString(record.summary) ??
        toTrimmedString(record.content) ??
        null,
      author: toTrimmedString(record.creator) ?? toTrimmedString(record.author) ?? null,
      pubDate: toIsoDate(record.isoDate) ?? toIsoDate(record.pubDate),
      guid,
    });

    return records;
  }, []);

export const parseFeed = async (url: string): Promise<ParsedFeedResult> => {
  const normalizedUrl = normalizeUrl(url);

  try {
    const parsedFeed = await parser.parseURL(normalizedUrl);
    const feedRecord = parsedFeed as Record<string, unknown>;
    const title = toTrimmedString(parsedFeed.title) ?? normalizedUrl;
    const description = toTrimmedString(parsedFeed.description) ?? null;
    const siteUrl = toTrimmedString(parsedFeed.link) ?? null;
    const imageUrl = extractFeedImageUrl(feedRecord);
    const articles = buildArticleRecords((parsedFeed.items ?? []) as unknown[]);

    return {
      title,
      url: normalizedUrl,
      description,
      siteUrl,
      imageUrl,
      articles,
    };
  } catch {
    throw new AppError(400, 'Unable to parse RSS feed', 'FEED_PARSE_ERROR');
  }
};

export const searchFeeds = async (query: string): Promise<SearchResult[]> => discoverFeeds(query);

export const subscribeToFeed = async (
  url: string,
): Promise<{ feed: Feed; articles: Article[] }> => {
  const parsedFeed = await parseFeed(url);
  const existingFeed = feedModel.getFeedByUrl(parsedFeed.url);
  if (existingFeed) {
    throw new AppError(409, 'Feed already subscribed', 'FEED_ALREADY_EXISTS');
  }

  const feed = feedModel.createFeed({
    title: parsedFeed.title,
    url: parsedFeed.url,
    description: parsedFeed.description,
    siteUrl: parsedFeed.siteUrl,
    imageUrl: parsedFeed.imageUrl,
  });

  articleModel.upsertArticles(parsedFeed.articles.map((article) => ({ ...article, feedId: feed.id })));

  return {
    feed,
    articles: (articleModel.getArticlesByFeedId ?? articleModel.listArticlesByFeedId)(feed.id),
  };
};

export const refreshFeed = async (
  id: number,
): Promise<Feed & { articles: Article[]; refreshedCount: number }> => {
  const existingFeed = feedModel.getFeedById(id);
  if (!existingFeed) {
    throw new AppError(404, 'Feed not found', 'FEED_NOT_FOUND');
  }

  const parsedFeed = await parseFeed(existingFeed.url);
  const updateFeed = (feedModel as Record<string, unknown>).updateFeed as
    | ((feedId: number, input: Record<string, unknown>) => Feed | null)
    | undefined;
  const updatedFeed = typeof updateFeed === 'function'
    ? updateFeed(id, {
        title: parsedFeed.title,
        url: existingFeed.url,
        description: parsedFeed.description,
        siteUrl: parsedFeed.siteUrl,
        imageUrl: parsedFeed.imageUrl,
      })
    : null;

  const refreshedCount = articleModel.upsertArticles(
    parsedFeed.articles.map((article) => ({
      ...article,
      feedId: id,
    })),
  );

  const getArticlesByFeedId = (articleModel as Record<string, unknown>).getArticlesByFeedId as
    | ((feedId: number) => Article[])
    | undefined;
  const listArticlesByFeedId = (articleModel as Record<string, unknown>).listArticlesByFeedId as
    | ((feedId: number) => Article[])
    | undefined;

  return {
    ...(updatedFeed ?? existingFeed),
    articles: (getArticlesByFeedId ?? listArticlesByFeedId ?? (() => []))(id),
    refreshedCount,
  };
};
