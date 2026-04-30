import Parser from 'rss-parser';
import type { SearchResult } from '../../shared/types/api.js';

const parser = new Parser();
const DISCOVERY_TIMEOUT_MS = 5000;
const KEYWORD_SEARCH_LIMIT = 5;
const FEED_CANDIDATE_LIMIT = 8;
const FEED_PATH_CANDIDATES = ['feed', 'rss', 'rss.xml', 'feed.xml', 'atom.xml', 'index.xml'];
const FEED_MIME_TYPES = ['application/rss+xml', 'application/atom+xml', 'application/rdf+xml'];

const toTrimmedString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    try {
      return new URL(`https://${trimmed}`).toString();
    } catch {
      return null;
    }
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

const toSearchResult = (feed: Record<string, unknown>, fallbackUrl: string): SearchResult => ({
  title: toTrimmedString(feed.title) ?? fallbackUrl,
  url: normalizeUrl(toTrimmedString(feed.feedUrl) ?? fallbackUrl) ?? fallbackUrl,
  description: toTrimmedString(feed.description) ?? null,
  siteUrl: toTrimmedString(feed.link) ?? null,
  imageUrl: extractFeedImageUrl(feed),
});

const dedupeResults = (results: Array<SearchResult | null | undefined>): SearchResult[] => {
  const deduped = new Map<string, SearchResult>();

  for (const result of results) {
    if (result && !deduped.has(result.url)) {
      deduped.set(result.url, result);
    }
  }

  return [...deduped.values()];
};

const isFeedMimeType = (value: string | null): boolean => {
  if (!value) {
    return false;
  }

  return FEED_MIME_TYPES.some((type) => value.toLowerCase().includes(type));
};

const fetchText = async (url: string, accept: string): Promise<string | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DISCOVERY_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: accept,
        'User-Agent': 'rssreader/0.1 (+https://github.com)',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const parseCandidateFeed = async (candidateUrl: string): Promise<SearchResult | null> => {
  try {
    const parsedFeed = await parser.parseURL(candidateUrl);
    return toSearchResult(parsedFeed as Record<string, unknown>, candidateUrl);
  } catch {
    return null;
  }
};

const extractAttribute = (tag: string, attribute: string): string | null => {
  const match = tag.match(new RegExp(`${attribute}\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))`, 'i'));
  return toTrimmedString(match?.[1] ?? match?.[2] ?? match?.[3]);
};

const extractAlternateFeedLinks = (html: string, pageUrl: string): string[] => {
  const matches = html.match(/<link\b[^>]*>/gi) ?? [];
  const links = new Set<string>();

  for (const tag of matches) {
    const rel = extractAttribute(tag, 'rel')?.toLowerCase() ?? '';
    const type = extractAttribute(tag, 'type')?.toLowerCase() ?? '';
    const href = extractAttribute(tag, 'href');

    if (!href || !rel.includes('alternate') || !isFeedMimeType(type)) {
      continue;
    }

    const normalized = normalizeUrl(new URL(href, pageUrl).toString());
    if (normalized) {
      links.add(normalized);
    }
  }

  return [...links];
};

const buildCommonFeedUrls = (pageUrl: string): string[] => {
  const url = new URL(pageUrl);
  const bases = new Set<string>([new URL('/', url).toString()]);

  if (url.pathname !== '/' && url.pathname !== '') {
    bases.add(new URL('./', url).toString());
  }

  const candidates = new Set<string>();

  for (const base of bases) {
    for (const path of FEED_PATH_CANDIDATES) {
      candidates.add(new URL(path, base).toString());
    }
  }

  return [...candidates];
};

const decodeSearchResultUrl = (href: string): string | null => {
  if (href.startsWith('/')) {
    const absolute = new URL(href, 'https://duckduckgo.com');
    const redirectTarget = absolute.searchParams.get('uddg');
    return redirectTarget ? normalizeUrl(decodeURIComponent(redirectTarget)) : null;
  }

  if (href.includes('duckduckgo.com/l/?')) {
    const redirectTarget = new URL(href).searchParams.get('uddg');
    return redirectTarget ? normalizeUrl(decodeURIComponent(redirectTarget)) : null;
  }

  return normalizeUrl(href);
};

const extractSearchResultUrls = (html: string): string[] => {
  const anchorMatches = html.match(/<a\b[^>]*href=(?:\"[^\"]*\"|'[^']*'|[^\s>]+)[^>]*>/gi) ?? [];
  const urls = new Set<string>();

  for (const tag of anchorMatches) {
    const href = extractAttribute(tag, 'href');
    if (!href) {
      continue;
    }

    const normalized = decodeSearchResultUrl(href);
    if (!normalized) {
      continue;
    }

    const hostname = new URL(normalized).hostname;
    if (hostname.includes('duckduckgo.com')) {
      continue;
    }

    urls.add(normalized);

    if (urls.size >= KEYWORD_SEARCH_LIMIT) {
      break;
    }
  }

  return [...urls];
};

const discoverFromWebsite = async (url: string): Promise<SearchResult[]> => {
  const html = await fetchText(url, 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1');
  if (!html) {
    return [];
  }

  const candidateUrls = [
    ...extractAlternateFeedLinks(html, url),
    ...buildCommonFeedUrls(url),
  ];

  const settled = await Promise.allSettled(
    [...new Set(candidateUrls)].slice(0, FEED_CANDIDATE_LIMIT).map((candidateUrl) => parseCandidateFeed(candidateUrl)),
  );

  return dedupeResults(
    settled.map((result) => (result.status === 'fulfilled' ? result.value : null)),
  );
};

export const looksLikeUrl = (query: string): boolean => {
  const trimmed = query.trim();
  if (!trimmed) {
    return false;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return normalizeUrl(trimmed) !== null;
  }

  if (trimmed.includes(' ')) {
    return false;
  }

  if (!/[./:]/.test(trimmed)) {
    return false;
  }

  return normalizeUrl(trimmed) !== null;
};

const discoverFromUrl = async (query: string): Promise<SearchResult[]> => {
  const normalizedUrl = normalizeUrl(query);
  if (!normalizedUrl) {
    return [];
  }

  const directMatch = await parseCandidateFeed(normalizedUrl);
  if (directMatch) {
    return [directMatch];
  }

  return discoverFromWebsite(normalizedUrl);
};

const discoverByKeyword = async (query: string): Promise<SearchResult[]> => {
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(`${query} rss`)}`;
  const html = await fetchText(searchUrl, 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1');
  if (!html) {
    return [];
  }

  const websites = extractSearchResultUrls(html);
  const settled = await Promise.allSettled(websites.map((website) => discoverFromUrl(website)));

  return dedupeResults(
    settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])),
  );
};

export const discoverFeeds = async (query: string): Promise<SearchResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  if (looksLikeUrl(trimmed)) {
    return discoverFromUrl(trimmed);
  }

  return discoverByKeyword(trimmed);
};
