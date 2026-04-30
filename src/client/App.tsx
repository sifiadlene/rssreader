import { Route, Routes } from 'react-router-dom';
import { Footer } from './components/Footer.js';
import { Header } from './components/Header.js';
import FeedDetailPage from './pages/FeedDetailPage.js';
import FeedListPage from './pages/FeedListPage.js';
import FeedSearchPage from './pages/FeedSearchPage.js';

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<FeedListPage />} />
          <Route path="/search" element={<FeedSearchPage />} />
          <Route path="/feed/:id" element={<FeedDetailPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
