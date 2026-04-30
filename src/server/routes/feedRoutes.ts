import { Router } from 'express';
import type {
  AddFeedRequest,
  AddFeedResponse,
  FeedDetailPayload,
  FeedDetailResponse,
  FeedListResponse,
  RefreshFeedResponse,
  SearchFeedsResponse,
} from '../../shared/types/api.js';
import type { Article } from '../../shared/types/article.js';
import type { Feed } from '../../shared/types/feed.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { deleteFeed, getFeedById, getFeeds } from '../models/feedModel.js';
import { getArticles } from '../services/articleService.js';
import { refreshFeed, searchFeeds, subscribeToFeed } from '../services/feedService.js';

const router = Router();

type SubscriptionResult = Feed | { feed: Feed; articles: Article[] };
type RefreshResult = Feed & { articles: Article[]; refreshedCount?: number };

const parseId = (value: string): number => {
  const id = Number.parseInt(value, 10);
  if (Number.isNaN(id) || id <= 0) {
    throw new AppError(400, 'Invalid feed id', 'INVALID_FEED_ID');
  }

  return id;
};

const buildFeedDetail = (feed: Feed, articles: Article[]): FeedDetailPayload => ({
  ...feed,
  feed,
  articles,
});

const normalizeSubscription = (subscription: SubscriptionResult): { feed: Feed; articles: Article[] } => {
  if ('feed' in subscription) {
    return subscription;
  }

  return {
    feed: subscription,
    articles: [],
  };
};

const normalizeRefresh = (payload: RefreshResult): RefreshFeedResponse => {
  const detail = buildFeedDetail(payload, payload.articles);

  return {
    ...detail,
    refreshedCount: payload.refreshedCount ?? payload.articles.length,
  };
};

router.get('/feeds', asyncHandler(async (_req, res) => {
  const response: FeedListResponse = await Promise.resolve(getFeeds());
  res.json(response);
}));

router.post('/feeds', asyncHandler(async (req, res) => {
  const body = req.body as Partial<AddFeedRequest>;
  if (typeof body.url !== 'string' || body.url.trim().length === 0) {
    throw new AppError(400, 'Feed URL is required', 'INVALID_FEED_URL');
  }

  const subscription = normalizeSubscription(await Promise.resolve(subscribeToFeed(body.url.trim())));
  const refreshed = await Promise.resolve(refreshFeed(subscription.feed.id)).catch(() => ({
    ...subscription.feed,
    articles: subscription.articles,
    refreshedCount: subscription.articles.length,
  }));
  const response: AddFeedResponse = buildFeedDetail(refreshed, refreshed.articles);

  res.status(201).json(response);
}));

router.delete('/feeds/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!(await Promise.resolve(deleteFeed(id)))) {
    throw new AppError(404, 'Feed not found', 'FEED_NOT_FOUND');
  }

  res.status(204).end();
}));

router.get('/feeds/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const feed = await Promise.resolve(getFeedById(id));
  if (!feed) {
    throw new AppError(404, 'Feed not found', 'FEED_NOT_FOUND');
  }

  const response: FeedDetailResponse = buildFeedDetail(feed, await Promise.resolve(getArticles(id)));

  res.json(response);
}));

router.post('/feeds/:id/refresh', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const refreshed = await Promise.resolve(refreshFeed(id));
  const response: RefreshFeedResponse = normalizeRefresh(refreshed);

  res.json(response);
}));

router.get('/search', asyncHandler(async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) {
    throw new AppError(400, 'Search query is required', 'INVALID_SEARCH_QUERY');
  }

  const response: SearchFeedsResponse = await Promise.resolve(searchFeeds(query));
  res.json(response);
}));

export default router;
