import { SearchBar } from '../components/SearchBar.js';
import { SearchResults } from '../components/SearchResults.js';
import { useSearch } from '../hooks/useSearch.js';

export default function FeedSearchPage() {
  const {
    query,
    results,
    loading,
    hasSearched,
    error,
    feedback,
    subscribingUrl,
    loadingMessage,
    setQuery,
    search,
    subscribe,
  } = useSearch();

  return (
    <section className="page stack-lg">
      <div className="hero-card">
        <div className="page-header page-header--stacked">
          <div className="page-header__content">
            <p className="eyebrow">Discover</p>
            <h1>Search for feeds</h1>
            <p>
              Search by topic, publication, or website URL, then discover real RSS feeds you can preview and subscribe to.
            </p>
          </div>
        </div>

        <SearchBar value={query} onChange={setQuery} onSubmit={() => void search(query)} isLoading={loading} />
      </div>

      {feedback ? <div className="status-inline status-inline--success">{feedback}</div> : null}
      {error ? <div className="status-inline status-inline--error">{error}</div> : null}

      <SearchResults
        results={results}
        hasSearched={hasSearched}
        isLoading={loading}
        loadingMessage={loadingMessage}
        subscribingUrl={subscribingUrl}
        onSubscribe={(url: string) => void subscribe(url)}
      />
    </section>
  );
}
