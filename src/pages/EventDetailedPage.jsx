import React, { useState, useEffect, useRef } from 'react';
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

  const fetchGameData = async () => {
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
  };

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

  return (
    <Layout>
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
