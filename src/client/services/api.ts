import type {
  AddFeedRequest,
  FeedListResponse,
  SearchFeedsResponse,
  SearchResult,
} from '../../shared/types/api.js';
import type { Article } from '../../shared/types/article.js';
import type { Feed } from '../../shared/types/feed.js';

export type FeedDetail = Feed & {
  feed: Feed;
  articles: Article[];
};

export type AddFeedResponse = FeedDetail;

export type FeedDetailResponse = FeedDetail;

export type RefreshFeedResponse = FeedDetail & {
  refreshedCount: number;
};

const API_ROOT = '/api';

type JsonRecord = Record<string, unknown>;

const toStringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const toNullableString = (value: unknown): string | null => (typeof value === 'string' ? value : null);

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  return false;
};

const readErrorMessage = (payload: unknown, status: number): string => {
  if (payload && typeof payload === 'object') {
    const record = payload as JsonRecord;
    const nestedError = record.error as JsonRecord | undefined;

    if (nestedError && typeof nestedError.message === 'string') {
      return nestedError.message;
    }

    if (typeof record.message === 'string') {
      return record.message;
    }
  }

  return `Request failed with status ${status}`;
};

const normalizeArticle = (raw: unknown): Article => {
  const record = (raw ?? {}) as JsonRecord;

  return {
    id: Number(record.id ?? 0),
    feedId: Number(record.feedId ?? record.feed_id ?? 0),
    title: toStringValue(record.title, 'Untitled article'),
    link: toStringValue(record.link, '#'),
    snippet: toNullableString(record.snippet),
    author: toNullableString(record.author),
    pubDate: toNullableString(record.pubDate ?? record.pub_date),
    guid: toNullableString(record.guid),
    isRead: toBoolean(record.isRead ?? record.is_read),
    createdAt: toStringValue(record.createdAt ?? record.created_at),
  };
};

const normalizeFeed = (raw: unknown): Feed => {
  const record = (raw ?? {}) as JsonRecord;

  return {
    id: Number(record.id ?? 0),
    title: toStringValue(record.title, 'Untitled feed'),
    url: toStringValue(record.url),
    description: toNullableString(record.description),
    siteUrl: toNullableString(record.siteUrl ?? record.site_url),
    imageUrl: toNullableString(record.imageUrl ?? record.image_url),
    createdAt: toStringValue(record.createdAt ?? record.created_at),
    updatedAt: toStringValue(record.updatedAt ?? record.updated_at),
  };
};

const normalizeSearchResult = (raw: unknown): SearchResult => {
  const record = (raw ?? {}) as JsonRecord;

  return {
    title: toStringValue(record.title, 'Untitled feed'),
    url: toStringValue(record.url),
    description: toNullableString(record.description),
    siteUrl: toNullableString(record.siteUrl ?? record.site_url),
    imageUrl: toNullableString(record.imageUrl ?? record.image_url),
  };
};

const normalizeFeedList = (payload: unknown): Feed[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeFeed);
  }

  const record = (payload ?? {}) as Partial<FeedListResponse> & JsonRecord;
  return Array.isArray(record.feeds) ? record.feeds.map(normalizeFeed) : [];
};

const normalizeFeedDetail = (payload: unknown): FeedDetailResponse => {
  const record = (payload ?? {}) as JsonRecord;
  const feed = normalizeFeed(record.feed ?? payload);
  const articles = Array.isArray(record.articles) ? record.articles.map(normalizeArticle) : [];

  return {
    ...feed,
    feed,
    articles,
  } as FeedDetailResponse;
};

const normalizeRefreshDetail = (payload: unknown): RefreshFeedResponse => {
  const detail = normalizeFeedDetail(payload);
  const record = (payload ?? {}) as JsonRecord;

  return {
    ...detail,
    feed: detail.feed ?? normalizeFeed((payload as JsonRecord).feed ?? payload),
    refreshedCount: Number(record.refreshedCount ?? record.refreshed_count ?? detail.articles.length),
  } as RefreshFeedResponse;
};

const normalizeSearchResults = (payload: unknown): SearchResult[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeSearchResult);
  }

  const record = (payload ?? {}) as Partial<SearchFeedsResponse> & JsonRecord;
  return Array.isArray(record.results) ? record.results.map(normalizeSearchResult) : [];
};

async function request<T>(path: string, init: RequestInit, transform: (payload: unknown) => T): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  let payload: unknown = null;

  if (typeof (response as { text?: unknown }).text === 'function') {
    const text = await (response as { text: () => Promise<string> }).text();
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = text;
      }
    }
  } else if (typeof (response as { json?: unknown }).json === 'function') {
    payload = await (response as { json: () => Promise<unknown> }).json();
  }

  if (!response.ok) {
    throw new Error(readErrorMessage(payload, response.status));
  }

  return transform(payload);
}

export function getFeeds(): Promise<Feed[]> {
  return request('/feeds', {}, normalizeFeedList);
}

export function getFeed(id: number): Promise<FeedDetailResponse> {
  return request(`/feeds/${id}`, {}, normalizeFeedDetail);
}

export function addFeed(url: string): Promise<AddFeedResponse> {
  const payload: AddFeedRequest = { url };

  return request(
    '/feeds',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    normalizeFeedDetail,
  );
}

export const createFeed = addFeed;

export function deleteFeed(id: number): Promise<void> {
  return request(`/feeds/${id}`, { method: 'DELETE' }, () => undefined);
}

export function refreshFeed(id: number): Promise<RefreshFeedResponse> {
  return request(`/feeds/${id}/refresh`, { method: 'POST' }, normalizeRefreshDetail);
}

export function searchFeeds(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });
  return request(`/search?${params.toString()}`, {}, normalizeSearchResults);
}
