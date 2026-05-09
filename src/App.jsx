import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import InPlayPage from './pages/InPlayPage';
import MultiMarketsPage from './pages/MultiMarketsPage';
import CricketPage from './pages/CricketPage';
import FootballPage from './pages/FootballPage';
import TennisPage from './pages/TennisPage';
import SportsPage from './pages/SportsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/Account/ProfilePage';
import BalanceOverviewPage from './pages/Account/BalanceOverviewPage';
import BetsHistoryPage from './pages/Account/BetsHistoryPage';
import AccountStatementPage from './pages/Account/AccountStatementPage';
import ActivityLogPage from './pages/Account/ActivityLogPage';
import HorseRacingPage from './pages/HorseRacingPage';
import GreyhoundRacingPage from './pages/GreyhoundRacingPage';
import FullMarketHorseRacingPage from './pages/FullMarketHorseRacingPage';
import FullMarketCricketPage from './pages/FullMarketCricketPage';
import FullMarketFootballPage from './pages/FullMarketFootballPage';
import FullMarketTennisPage from './pages/FullMarketTennisPage';
import EventDetailedPage from './pages/EventDetailedPage';
import EventDetailedPageMobile from './pages/EventDetailedPageMobile';
import DepositPage from './pages/DepositPage';
import WithdrawPage from './pages/WithdrawPage';
import NotFoundPage from './pages/NotFoundPage';
import CasinoPage from './pages/Casino/CasinoPage';
import CasinoProviderPage from './pages/Casino/CasinoProviderPage';
import CasinoNamePage from './pages/Casino/CasinoNamePage';
import OffersPage from './pages/OffersPage';

import './App.css';

import Snackbar from './components/Snackbar';
import PopupModal from './components/PopupModal';
import SessionWatchdog from './components/SessionWatchdog';

const ResponsiveEventDetails = () => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? <EventDetailedPageMobile /> : <EventDetailedPage />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/index" element={<HomePage />} />
        <Route path="/in-play" element={<InPlayPage />} />
        <Route path="/multi-markets" element={<MultiMarketsPage />} />
        <Route path="/cricket" element={<CricketPage />} />
        <Route path="/football" element={<FootballPage />} />
        <Route path="/tennis" element={<TennisPage />} />
        <Route path="/horse-racing" element={<HorseRacingPage />} />
        <Route path="/greyhound-racing" element={<GreyhoundRacingPage />} />
        <Route path="/full-market-cricket" element={<FullMarketCricketPage />} />
        <Route path="/full-market-football" element={<FullMarketFootballPage />} />
        <Route path="/full-market-tennis" element={<FullMarketTennisPage />} />
        <Route path="/full-market-horse-racing" element={<FullMarketHorseRacingPage />} />
        <Route path="/event-detail/:matchId/:eventId?" element={<ResponsiveEventDetails />} />
        <Route path="/:sport/:matchId/:eventId?" element={<ResponsiveEventDetails />} />
        <Route path="/sports" element={<SportsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/balance-overview" element={<BalanceOverviewPage />} />
        <Route path="/bets" element={<BetsHistoryPage />} />
        <Route path="/statement" element={<AccountStatementPage />} />
        <Route path="/activity-log" element={<ActivityLogPage />} />
        <Route path="/wallet/deposit" element={<DepositPage />} />
        <Route path="/wallet/withdrawal" element={<WithdrawPage />} />
        <Route path="/casino" element={<CasinoPage />} />
        <Route path="/provider/:providerTag" element={<CasinoProviderPage />} />
        <Route path="/title/:titleTag" element={<CasinoNamePage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Snackbar />
      <PopupModal />
      <SessionWatchdog />
    </Router>
  );
}

export default App;
