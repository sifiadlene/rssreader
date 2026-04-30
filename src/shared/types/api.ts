import type { Article } from './article.js';
import type { Feed } from './feed.js';

export interface ApiError {
  message: string;
  code: string;
}

export interface ErrorResponse {
  error: ApiError;
}

export interface AddFeedRequest {
  url: string;
}

export type FeedWithArticles = Feed & {
  articles: Article[];
};

export type FeedEnvelope = {
  feed: Feed;
  articles: Article[];
};

export type FeedDetailPayload = FeedWithArticles & FeedEnvelope;

export type FeedListResponse = Feed[] | { feeds: Feed[] };

export type FeedDetailResponse = FeedDetailPayload;

export type AddFeedResponse = FeedDetailPayload;

export type DeleteFeedResponse = undefined | { success: true };

export type RefreshFeedResponse = FeedDetailPayload & {
  refreshedCount: number;
};

export interface SearchResult {
  title: string;
  url: string;
  description: string | null;
  siteUrl: string | null;
  imageUrl: string | null;
}

export type SearchFeedsResponse = SearchResult[] | { results: SearchResult[] };
