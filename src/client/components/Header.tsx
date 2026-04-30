import { useState } from 'react';
import { NavLink, useInRouterContext } from 'react-router-dom';

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `nav-link${isActive ? ' nav-link--active' : ''}`;

export function Header() {
  const inRouter = useInRouterContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 18h.01" />
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
            </svg>
          </span>
          <div className="brand-copy">
            <p className="eyebrow">RSS Reader</p>
            {inRouter ? (
              <NavLink className="brand" to="/" onClick={closeMenu}>
                Follow your feeds calmly.
              </NavLink>
            ) : (
              <a className="brand" href="/">
                Follow your feeds calmly.
              </a>
            )}
          </div>
        </div>

        <div className="site-header__actions">
          <span className="header-pill">Fresh stories, less noise</span>
          <button
            className="nav-toggle"
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isMenuOpen ? (
                <path d="M6 6 18 18M18 6 6 18" />
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>

        <nav
          id="primary-navigation"
          className={`site-nav${isMenuOpen ? ' site-nav--open' : ''}`}
          aria-label="Primary"
        >
          {inRouter ? (
            <>
              <NavLink className={navLinkClassName} to="/" end onClick={closeMenu}>
                Library
              </NavLink>
              <NavLink className={navLinkClassName} to="/search" onClick={closeMenu}>
                Discover
              </NavLink>
            </>
          ) : (
            <>
              <a className="nav-link" href="/">
                Library
              </a>
              <a className="nav-link" href="/search">
                Discover
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
