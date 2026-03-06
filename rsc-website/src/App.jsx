import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import TierPage from './pages/TierPage';
import FranchiseStandingsPage from './pages/FranchiseStandingsPage';
import FranchisePage from './pages/FranchisePage';
import TeamPage from './pages/TeamPage';
import PlayerPage from './pages/PlayerPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tier/:tier" element={<TierPage />} />
          <Route path="tier/:tier/:tab" element={<TierPage />} />
          <Route path="franchise-standings" element={<FranchiseStandingsPage />} />
          <Route path="franchise/:franchiseName" element={<FranchisePage />} />
          <Route path="team/:teamName" element={<TeamPage />} />
          <Route path="team/:teamName/:tab" element={<TeamPage />} />
          <Route path="player/:playerName" element={<PlayerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
