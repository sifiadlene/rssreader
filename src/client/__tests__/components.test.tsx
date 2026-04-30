import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { sampleArticle, sampleFeed } from '../../test/fixtures';

async function loadComponent<T>(path: string, exportName: string): Promise<T> {
  try {
    const module = (await import(path)) as Record<string, unknown>;
    const component = module[exportName] ?? module.default;

    if (!component) {
      throw new Error(`Expected ${exportName} export from ${path}.`);
    }

    return component as T;
  } catch (error) {
    throw new Error(`Expected component module ${path} to exist. ${(error as Error).message}`);
  }
}

describe('UI component contracts', () => {
  it('Header renders the app title and navigation', async () => {
    const Header = await loadComponent<React.ComponentType>('../components/Header.tsx', 'Header');

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText(/rss reader/i)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
  });

  it('FeedCard renders feed metadata and unread count', async () => {
    const FeedCard = await loadComponent<React.ComponentType<{ feed: typeof sampleFeed; unreadCount?: number }>>(
      '../components/FeedCard.tsx',
      'FeedCard',
    );

    render(
      <MemoryRouter>
        <FeedCard feed={sampleFeed} unreadCount={3} />
      </MemoryRouter>,
    );

    expect(screen.getByText(sampleFeed.title)).toBeInTheDocument();
    expect(screen.getByText(sampleFeed.description)).toBeInTheDocument();
    expect(screen.getByText(/3 articles/i)).toBeInTheDocument();
  });

  it('ArticleItem renders article content and link', async () => {
    const ArticleItem = await loadComponent<React.ComponentType<{ article: typeof sampleArticle }>>(
      '../components/ArticleItem.tsx',
      'ArticleItem',
    );

    render(<ArticleItem article={sampleArticle} />);

    expect(screen.getByText(sampleArticle.title)).toBeInTheDocument();
    expect(screen.getByText(sampleArticle.snippet)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(sampleArticle.title, 'i') })).toHaveAttribute('href', sampleArticle.link);
  });
});
