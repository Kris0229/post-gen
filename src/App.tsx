import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthGate from './components/AuthGate';
import Layout from './components/Layout';
import NewsFeedPage from './pages/NewsFeedPage';
import ArticlePage from './pages/ArticlePage';
import MaterialsPage from './pages/MaterialsPage';
import WriteListPage from './pages/WriteListPage';
import WriteSessionPage from './pages/WriteSessionPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AuthGate>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<NewsFeedPage />} />
            <Route path="article/:id" element={<ArticlePage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="write" element={<WriteListPage />} />
            <Route path="write/:sessionId" element={<WriteSessionPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthGate>
  );
}
