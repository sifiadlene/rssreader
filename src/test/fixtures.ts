export const TEST_DATETIME = '2026-04-30T00:26:03.781+00:00';

export const sampleFeedInput = {
  url: 'https://example.com/feed.xml',
};

export const sampleFeed = {
  id: 1,
  title: 'Example Feed',
  url: 'https://example.com/feed.xml',
  description: 'A sample RSS feed used by contract tests.',
  siteUrl: 'https://example.com',
  imageUrl: 'https://example.com/logo.png',
  createdAt: TEST_DATETIME,
  updatedAt: TEST_DATETIME,
};

export const updatedFeed = {
  ...sampleFeed,
  title: 'Updated Example Feed',
  description: 'An updated description for the sample feed.',
};

export const sampleArticle = {
  id: 101,
  feedId: sampleFeed.id,
  title: 'Example Article',
  link: 'https://example.com/articles/1',
  snippet: 'A short article summary for testing.',
  author: 'Example Author',
  pubDate: TEST_DATETIME,
  guid: 'example-article-1',
  isRead: false,
  createdAt: TEST_DATETIME,
};

export const readArticle = {
  ...sampleArticle,
  isRead: true,
};

export const sampleParsedFeed = {
  title: sampleFeed.title,
  description: sampleFeed.description,
  link: sampleFeed.siteUrl,
  image: {
    url: sampleFeed.imageUrl,
  },
  items: [
    {
      title: sampleArticle.title,
      link: sampleArticle.link,
      contentSnippet: sampleArticle.snippet,
      creator: sampleArticle.author,
      pubDate: sampleArticle.pubDate,
      guid: sampleArticle.guid,
    },
  ],
};

export const sampleSearchResult = {
  title: 'Search Result Feed',
  url: 'https://search.example.com/rss.xml',
  description: 'A discovered feed result.',
  siteUrl: 'https://search.example.com',
};
