import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BetSlip from '../components/BetSlip';
import Layout from '../components/Layout';
import EventLayout from '../components/Layout/EventLayout';
import ScoreboardRender from '../components/EventDetailedPage/ScoreboardRender';
import SportCompetition from '../components/EventDetailedPage/SportCompetition';
import OddsTable from '../components/EventDetailedPage/MatchTable/OddsTable';
import BookmakerTable from '../components/EventDetailedPage/MatchTable/BookmakerTable';
import FancyTable from '../components/EventDetailedPage/MatchTable/FancyTable';
import { marketController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useRatePolling } from '../hooks/useRatePolling';
import { useSnackbarStore } from '../store/snackbarStore';

const parseDate = (str) => {
  if (!str) return null;
  const dateVal = str.includes('T') ? str : str.replace(' ', 'T');
  let d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    const parts = str.split(/[-/ :]/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (day <= 31 && month <= 11) {
        const hour = parseInt(parts[3] || '0', 10);
        const minute = parseInt(parts[4] || '0', 10);
        const second = parseInt(parts[5] || '0', 10);
        d = new Date(year, month, day, hour, minute, second);
      }
    }
  }
  return d && !isNaN(d.getTime()) ? d : null;
};

const formatDateTime = (dateStr) => {
  const d = parseDate(dateStr);
  if (!d) return dateStr || '';

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return d.toLocaleString('en-GB', options).replace(',', '');
};

const EventDetailedPage = () => {
  const { sport, matchId, eventId } = useParams();
  const navigate = useNavigate();
  const { loginToken, isLoggedIn } = useAuthStore();
  const openLoginModal = useUIStore(state => state.openLoginModal);
  const showSnackbar = useSnackbarStore(state => state.show);

  const [selectedBet, setSelectedBet] = useState(null);
  const [activeInns, setActiveInns] = useState(1);
  const [gameData, setGameData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreboardHtml, setScoreboardHtml] = useState(null);
  const [tvVisible, setTvVisible] = useState(false);
  const [tvHtml, setTvHtml] = useState(null);
  const [tvLoading, setTvLoading] = useState(false);
  const pollingRef = useRef(null);

  // Hook for live rates
  const { liveRates, scoreboardHtml: liveScoreboardHtml } = useRatePolling(matchId, gameData, 1000);

  // Sync scoreboard HTML from hook to local state
  useEffect(() => {
    if (liveScoreboardHtml) {
      setScoreboardHtml(liveScoreboardHtml);
    }
  }, [liveScoreboardHtml]);

  const fetchGameData = useCallback(async () => {
    try {
      setIsLoading(true);
      let res;
      if (isLoggedIn && loginToken) {
        console.log('Calling getGameDataLogin for gid:', matchId);
        res = await marketController.getGameDataLogin(loginToken, matchId);
      } else {
        console.log('Calling getGameData for gid:', matchId);
        res = await marketController.getGameData(matchId);
      }

      if (res && !res.error) {
        let parsed = typeof res === 'string' ? JSON.parse(res) : res;
        // Handle nested "0" key common in this API
        if (parsed && parsed["0"]) parsed = parsed["0"];
        setGameData(parsed);
      } else {
        console.error('API Error:', res?.msg || 'Unknown error');
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, loginToken, matchId]);

  // Listen for bet placement to refresh exposure/charts
  useEffect(() => {
    const handleBetPlaced = (e) => {
      if (e.detail?.matchId?.toString() === matchId?.toString()) {
        fetchGameData();
      }
    };
    window.addEventListener('bet-placed', handleBetPlaced);
    return () => window.removeEventListener('bet-placed', handleBetPlaced);
  }, [matchId, fetchGameData]);

  const handleToggleFavourite = async () => {
    if (!isLoggedIn || !loginToken) {
      openLoginModal();
      return;
    }

    try {
      // Correct extraction of EID as per betting-pwa logic
      const eidToUse = gameData?.events?.['0']?.eid ||
        gameData?.events?.[0]?.eid ||
        gameData?.Event_Id ||
        gameData?.eventid ||
        gameData?.eid ||
        matchId;

      console.log('Toggling favourite for EID:', eidToUse);
      const res = await marketController.toggleFavourite(loginToken, eidToUse.toString());
      if (res && res.error === '0') {
        showSnackbar(res.msg || 'Favourite updated', 'success');
      } else {
        showSnackbar(res?.msg || 'Failed to update favourite', 'error');
      }
    } catch (err) {
      console.error('Favourite error:', err);
    }
  };

  const toggleTv = async () => {
    if (!tvVisible && !tvHtml) {
      const eventId = gameData?.Event_Id || gameData?.eventid || matchId;
      if (!isLoggedIn || !loginToken) {
        openLoginModal();
        return;
      }
      setTvLoading(true);
      try {
        console.log('Fetching TV for event:', eventId);
        const res = await marketController.getOpenTv(loginToken, eventId.toString());
        if (res.error === '0' && res.data) {
          setTvHtml(res.data);
          setTvVisible(true);
        } else {
          showSnackbar(res.msg || 'TV not available for this event', 'info');
        }
      } catch (err) {
        console.error('TV Error:', err);
        showSnackbar('Failed to load TV', 'error');
      } finally {
        setTvLoading(false);
      }
    } else {
      setTvVisible(!tvVisible);
    }
  };

  useEffect(() => {
    if (matchId) {
      fetchGameData();
    }
  }, [matchId, isLoggedIn, loginToken]);

  const handleBetClick = (runner, type, price, market = 'Match Odds', runnerIndex, marketData, selectionId) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    setSelectedBet({
      runner,
      type,
      price,
      market,
      runnerIndex,
      marketData,
      selectionId
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh] text-gray-500 font-bold">
          Loading Event Details...
        </div>
      </Layout>
    );
  }

  // Determine if match is In-Play for the header and tables
  const startTimeStr = gameData?.DateTime || gameData?.dateTime || gameData?.Datetime || gameData?.staredtime || gameData?.StartTime || '';
  const startTime = parseDate(startTimeStr);
  const isWinnerMarket = (gameData?.Game_Type || gameData?.GameType || '').toLowerCase() === 'winner' ||
    (gameData?.Team2 || '').includes('TOURNAMENT_WINNER');
  const now = new Date();
  const isInPlay = gameData?.Inplay === 'true' || gameData?.Inplay === 'Y' || gameData?.Inplay === true ||
    gameData?.inplay === 'true' || gameData?.inplay === 'Y' || gameData?.inplay === true ||
    (startTime && startTime <= now) || isWinnerMarket;

  return (
    <Layout>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <EventLayout
        left={
          <SportCompetition
            sport={sport}
            competition={gameData?.Competition}
            matchName={gameData?.Game_name || `${gameData?.Team1} v ${gameData?.Team2}`}
          />
        }
        right={
          <div className="h-full flex flex-col">

            <div className="p-1 flex-1 overflow-y-auto">
              <BetSlip />
            </div>
          </div>
        }
      >
        {/* Middle Main Content */}
        <div className="flex flex-col h-full">
          {/* Top Event Header: Back, Name, Time */}
          <div className="event-header-top" style={{
            background: '#253845',
            color: '#fff',
            padding: '12px 15px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',

            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: '#ffb400',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                cursor: 'pointer',
                color: '#000',
                fontWeight: '900',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textTransform: 'uppercase',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5a200'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ffb400'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Back
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '900',
                  color: '#fff',
                  letterSpacing: '0.5px',
                  lineHeight: '1.2'
                }}>
                  {gameData?.Game_name || `${gameData?.Team1} v ${gameData?.Team2}`}
                </h2>
                {isInPlay && (
                  <span style={{ 
                    background: '#2aa84a', 
                    color: '#fff', 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                    In-Play
                  </span>
                )}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#ffb400',
                fontWeight: 'bold',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {formatDateTime(gameData?.DateTime || gameData?.dateTime || gameData?.Datetime || gameData?.staredtime || gameData?.StartTime || '')}
              </div>
            </div>
          </div>

          {/* Scoreboard Section with integrated controls */}
          <ScoreboardRender
            html={scoreboardHtml}
            onPin={handleToggleFavourite}
            onRefresh={fetchGameData}
            tvVisible={tvVisible}
            tvHtml={tvHtml}
            tvLoading={tvLoading}
            toggleTv={toggleTv}
          />
          <ul className="match-btn flex justify-center">
            <li>
              <a id="liveMultiMarketPin" class="btn-pin"
                title="Add to Multi Markets" onClick={(e) => {
                  e.preventDefault();
                  handleToggleFavourite();
                }}  > </a>
            </li>
            <li>
              <a class="btn-refresh" onClick={(e) => {
                e.preventDefault();
                fetchGameData();
              }}
              > </a>
            </li>
          </ul>
          {/* Market content area */}
          <div className="p-4 flex-1 overflow-y-auto">
            {/* Dynamic Market Rendering */}
            {(() => {
              const isRacing = sport === 'horse-racing' || sport === 'greyhound-racing';
              let eventList = Object.values(gameData?.events || {});

              if (isRacing && eventId) {
                eventList = eventList.filter(e => e.eid?.toString() === eventId.toString());
              }

              // Determine if match is In-Play
              const startTimeStr = gameData?.DateTime || gameData?.dateTime || gameData?.Datetime || gameData?.staredtime || gameData?.StartTime || '';
              const startTime = parseDate(startTimeStr);
              const isWinnerMarket = (gameData?.Game_Type || gameData?.GameType || '').toLowerCase() === 'winner' ||
                (gameData?.Team2 || '').includes('TOURNAMENT_WINNER');
              const now = new Date();
              const isInPlay = gameData?.Inplay === 'true' || gameData?.Inplay === 'Y' || gameData?.Inplay === true ||
                gameData?.inplay === 'true' || gameData?.inplay === 'Y' || gameData?.inplay === true ||
                (startTime && startTime <= now) || isWinnerMarket;

              // Group Fancy markets to show them together at the bottom or top
              const fancyMarkets = eventList.filter(e => e.Type === 'FANCY');
              // Other markets to render individually
              const otherMarkets = eventList.filter(e => e.Type !== 'FANCY');

              return (
                <>
                  {otherMarkets.map((market, mIdx) => {
                    const type = market.Type?.toUpperCase();
                    const name = market.name?.toUpperCase() || '';

                    // Main Match Odds
                    if (type === 'ODDS') {
                      return (
                        <OddsTable
                          key={market.eid || mIdx}
                          marketData={market}
                          liveRates={liveRates}
                          selectedBet={selectedBet}
                          onCancelBet={() => setSelectedBet(null)}
                          onBetClick={(runner, side, price, runnerIndex, selectionId) => handleBetClick(runner, side, price, market.name, runnerIndex, market, selectionId)}
                          sport={sport}
                          isInPlay={isInPlay}
                        />
                      );
                    }

                    // All Bookmaker variations
                    if (type === 'BOOKMAKER') {
                      return (
                        <BookmakerTable
                          key={market.eid || mIdx}
                          bookmakerData={market}
                          liveRates={liveRates}
                          selectedBet={selectedBet}
                          onCancelBet={() => setSelectedBet(null)}
                          onBetClick={(runner, side, price, runnerIndex) => handleBetClick(runner, side, price, market.name, runnerIndex, market)}
                        />
                      );
                    }

                    // ODDS, EXTRA (Tied Match), and others
                    return (
                      <OddsTable
                        key={market.eid || mIdx}
                        marketName={market.name}
                        marketData={market}
                        liveRates={liveRates}
                        selectedBet={selectedBet}
                        onCancelBet={() => setSelectedBet(null)}
                        onBetClick={(runner, side, price, runnerIndex, selectionId) => handleBetClick(runner, side, price, market.name, runnerIndex, market, selectionId)}
                        sport={sport}
                        isInPlay={isInPlay}
                      />
                    );
                  })}

                  {/* Grouped Fancy Markets */}
                  {fancyMarkets.length > 0 && (
                    <FancyTable
                      fancyData={fancyMarkets}
                      liveRates={liveRates}
                      selectedBet={selectedBet}
                      onCancelBet={() => setSelectedBet(null)}
                      onBetClick={(bet) => handleBetClick(bet.name, bet.side, bet.price, 'Fancy Bet', bet.runnerIndex, bet.marketData)}
                      matchId={matchId}
                    />
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </EventLayout>
    </Layout>
  );
};

export default EventDetailedPage;
