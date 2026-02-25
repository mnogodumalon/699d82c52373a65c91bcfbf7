import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import TaeglicherCheckInPage from '@/pages/TaeglicherCheckInPage';
import TrackingEintraegePage from '@/pages/TrackingEintraegePage';
import GewohnheitenPage from '@/pages/GewohnheitenPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="taeglicher-check-in" element={<TaeglicherCheckInPage />} />
          <Route path="tracking-eintraege" element={<TrackingEintraegePage />} />
          <Route path="gewohnheiten" element={<GewohnheitenPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}