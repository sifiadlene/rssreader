import { FormEvent } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function SearchBar({ value, onChange, onSubmit, isLoading = false }: SearchBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit} aria-busy={isLoading}>
      <div className="search-bar__field">
        <span className="search-bar__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <input
          className="search-bar__input"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by topic, site, or paste a website/RSS URL"
          aria-label="Search feeds"
        />
        {isLoading ? <span className="search-bar__spinner" aria-hidden="true" /> : null}
      </div>
      <button className="button search-bar__submit" type="submit" disabled={isLoading}>
        {isLoading ? <span className="button__spinner" aria-hidden="true" /> : null}
        {isLoading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}
