import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sampleFeed, sampleParsedFeed } from '../../test/fixtures';

const createHtmlResponse = (html: string) => ({
  ok: true,
  text: async () => html,
});

describe('feedDiscoveryService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('returns a direct match when the query is already a feed URL', async () => {
    const parserParseURL = vi.fn().mockResolvedValue(sampleParsedFeed);
    const fetchMock = vi.fn();

    vi.doMock('rss-parser', () => ({
      default: class Parser {
        parseURL = parserParseURL;
      },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { discoverFeeds } = await import('../services/feedDiscoveryService.js');
    const results = await discoverFeeds(sampleFeed.url);

    expect(parserParseURL).toHaveBeenCalledWith(sampleFeed.url);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(results).toEqual([
      expect.objectContaining({
        title: sampleFeed.title,
        url: sampleFeed.url,
        siteUrl: sampleFeed.siteUrl,
      }),
    ]);
  });

  it('discovers feeds from alternate link tags on a website page', async () => {
    const parserParseURL = vi.fn().mockImplementation(async (url: string) => {
      if (url === 'https://example.com/feed.xml') {
        return sampleParsedFeed;
      }

      throw new Error('not a feed');
    });
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === 'https://example.com/') {
        return createHtmlResponse('<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml" /></head></html>');
      }

      throw new Error(`unexpected fetch: ${url}`);
    });

    vi.doMock('rss-parser', () => ({
      default: class Parser {
        parseURL = parserParseURL;
      },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { discoverFeeds } = await import('../services/feedDiscoveryService.js');
    const results = await discoverFeeds('https://example.com');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/',
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: expect.stringContaining('text/html') }),
      }),
    );
    expect(results).toEqual([
      expect.objectContaining({
        title: sampleFeed.title,
        url: 'https://example.com/feed.xml',
      }),
    ]);
  });

  it('uses keyword search results to discover feeds on matching sites', async () => {
    const parserParseURL = vi.fn().mockImplementation(async (url: string) => {
      if (url === 'https://search.example.com/rss.xml') {
        return {
          ...sampleParsedFeed,
          title: 'Search Result Feed',
          link: 'https://search.example.com',
        };
      }

      throw new Error('not a feed');
    });
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (typeof url !== 'string') {
        throw new Error('unexpected request');
      }

      if (url.startsWith('https://duckduckgo.com/html/?q=climate%20rss')) {
        return createHtmlResponse(
          `<html><body><a href="/l/?uddg=${encodeURIComponent('https://search.example.com')}">Search Example</a></body></html>`,
        );
      }

      if (url === 'https://search.example.com/') {
        return createHtmlResponse('<html><head><link rel="alternate" type="application/rss+xml" href="/rss.xml" /></head></html>');
      }

      throw new Error(`unexpected fetch: ${url}`);
    });

    vi.doMock('rss-parser', () => ({
      default: class Parser {
        parseURL = parserParseURL;
      },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { discoverFeeds } = await import('../services/feedDiscoveryService.js');
    const results = await discoverFeeds('climate');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://duckduckgo.com/html/?q=climate%20rss'),
      expect.any(Object),
    );
    expect(results).toEqual([
      expect.objectContaining({
        title: 'Search Result Feed',
        url: 'https://search.example.com/rss.xml',
        siteUrl: 'https://search.example.com',
      }),
    ]);
  });
});
