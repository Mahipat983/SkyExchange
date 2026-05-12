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
import { marketController, bettingController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useRatePolling } from '../hooks/useRatePolling';
import { useSnackbarStore } from '../store/snackbarStore';
import { parseDate } from '../utils/format';

// Local parseDate removed, using centralized utility from ../utils/format

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

  // Fancy Chart State
  const [fancyChartOpen, setFancyChartOpen] = useState(false);
  const [fancyChartLoading, setFancyChartLoading] = useState(false);
  const [fancyChartData, setFancyChartData] = useState(null);
  const [fancyChartTitle, setFancyChartTitle] = useState('');
  const [cashoutLoading, setCashoutLoading] = useState(null);

  const groupedChartData = React.useMemo(() => {
    if (!fancyChartData || typeof fancyChartData !== 'object' || fancyChartData.error) return [];

    // API returns numeric keys as strings
    const keys = Object.keys(fancyChartData)
      .filter(k => !isNaN(parseInt(k)))
      .sort((a, b) => parseInt(a) - parseInt(b));

    if (keys.length === 0) return [];

    const result = [];
    let startKey = keys[0];
    let currentValue = fancyChartData[startKey];

    for (let i = 1; i < keys.length; i++) {
      const key = keys[i];
      const val = fancyChartData[key];

      if (val !== currentValue) {
        const endKey = keys[i - 1];
        result.push({
          run: startKey === endKey ? startKey : `${startKey} - ${endKey}`,
          position: currentValue
        });
        startKey = key;
        currentValue = val;
      }
    }

    const lastKey = keys[keys.length - 1];
    result.push({
      run: startKey === lastKey ? startKey : `${startKey} - ${lastKey}`,
      position: currentValue
    });

    return result;
  }, [fancyChartData]);

  const openFancyChart = async (eid, name) => {
    if (!isLoggedIn || !loginToken) {
      openLoginModal();
      return;
    }
    setFancyChartTitle(name);
    setFancyChartOpen(true);
    setFancyChartLoading(true);
    setFancyChartData(null);
    try {
      const res = await bettingController.getFancyChart(loginToken, eid.toString());
      setFancyChartData(res);
    } catch (err) {
      console.error('Failed to fetch fancy chart:', err);
      setFancyChartData({ error: '1', msg: 'Failed to load chart data' });
    } finally {
      setFancyChartLoading(false);
    }
  };

  // Hook for live rates
  const { liveRates, scoreboardHtml: liveScoreboardHtml } = useRatePolling(matchId, gameData, 1000);

  // Sync scoreboard HTML from hook to local state
  useEffect(() => {
    if (liveScoreboardHtml) {
      setScoreboardHtml(liveScoreboardHtml);
    }
  }, [liveScoreboardHtml]);

  const fetchGameData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
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
      if (showLoading) setIsLoading(false);
    }
  }, [isLoggedIn, loginToken, matchId]);

  // Listen for bet placement to refresh exposure/charts
  useEffect(() => {
    const handleBetPlaced = (e) => {
      if (e.detail?.matchId?.toString() === matchId?.toString()) {
        fetchGameData(false);
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
        showSnackbar('Event added in Multi Market', 'success');
      } else {
        showSnackbar('Failed to add in Multi Market', 'error');
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
      fetchGameData(true); // Initial load shows spinner
      
      const interval = setInterval(() => fetchGameData(false), 5000); // Polling is background
      return () => clearInterval(interval);
    }
  }, [matchId, isLoggedIn, loginToken, fetchGameData]);

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
      selectionId,
      stake: marketData?.cashoutAmount // Pass stake if it's a cashout
    });
  };

  const handleCashout = async (mId, mName, runners, mType) => {
    if (!isLoggedIn || !loginToken) {
      openLoginModal();
      return;
    }

    const eid = mId || gameData?.Event_Id || gameData?.eventid || matchId;
    setCashoutLoading(mId);
    try {
      const res = await bettingController.cashout(loginToken, eid);
      const cashout = Array.isArray(res) ? res[0] : res;

      if (cashout && cashout.Amount > 0) {
        // Map Team "A" -> 0, Team "B" -> 1
        const teamIdx = cashout.Team === 'B' ? 1 : 0;
        const runner = Array.isArray(runners) ? runners[teamIdx] : Object.values(runners || {})[teamIdx];
        if (!runner) throw new Error('Runner not found');

        const selectionId = runner.selectionId || runner.id || runner.SelectionId || teamIdx;
        const bSide = cashout.Type === 'L' ? 'lay' : 'back';

        handleBetClick(
          runner.name || runner.Name || runner.RunnerName || (teamIdx === 0 ? 'Team A' : 'Team B'),
          bSide,
          parseFloat(cashout.Rate),
          mName,
          teamIdx,
          { Type: mType, cashoutAmount: cashout.Amount }, // Pass cashout amount
          selectionId
        );
        
        showSnackbar(`Cashout ready: Guaranteed ${cashout.Chart1 || cashout.Chart2 || ''}`, 'success');
      } else {
        showSnackbar('No cashout available right now', 'info');
      }
    } catch (err) {
      console.error('Cashout failed:', err);
      showSnackbar('Failed to fetch cashout', 'error');
    } finally {
      setCashoutLoading(null);
    }
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
            events={gameData?.events}
          />
        }
        right={
          <div className="h-full flex flex-col">

            <div className="p-1 flex-1 overflow-y-auto">
              <BetSlip sport={sport} />
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
            onRefresh={() => fetchGameData(false)}
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
                fetchGameData(false);
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

              // Group Fancy markets
              const fancyMarkets = eventList.filter(e => e.Type === 'FANCY');
              // Group Line markets
              const lineMarkets = eventList.filter(e => (e.Type === 'LINE' || (e.name && e.name.toUpperCase().includes('LINE'))));
              // Other markets to render individually
              const otherMarkets = eventList.filter(e => e.Type !== 'FANCY' && e.Type !== 'LINE' && !(e.name && e.name.toUpperCase().includes('LINE')));

              return (
                <>
                  {otherMarkets.map((market, mIdx) => {
                    const type = market.Type?.toUpperCase();
                    const name = market.name?.toUpperCase() || '';

                    // Main Match Odds
                    if (type === 'ODDS') {
                      return (
                        <div key={market.eid || mIdx} id={`market-${name.replace(/\s+/g, '-')}`}>
                          <OddsTable
                            marketData={market}
                            liveRates={liveRates}
                            selectedBet={selectedBet}
                            onCancelBet={() => setSelectedBet(null)}
                            onBetClick={(runner, side, price, runnerIndex, selectionId) => handleBetClick(runner, side, price, market.name, runnerIndex, market, selectionId)}
                            onCashout={handleCashout}
                            isCashoutLoading={cashoutLoading === (market.MarketId || market.marketid || market.eid)}
                            sport={sport}
                            isInPlay={isInPlay}
                          />
                        </div>
                      );
                    }

                    // All Bookmaker variations
                    if (type === 'BOOKMAKER') {
                      return (
                        <div key={market.eid || mIdx} id={`market-${name.replace(/\s+/g, '-')}`}>
                          <BookmakerTable
                            bookmakerData={market}
                            liveRates={liveRates}
                            selectedBet={selectedBet}
                            onCancelBet={() => setSelectedBet(null)}
                            onBetClick={(runner, side, price, runnerIndex) => handleBetClick(runner, side, price, market.name, runnerIndex, market)}
                            onCashout={handleCashout}
                            isCashoutLoading={cashoutLoading === (market.MarketId || market.marketid || market.eid)}
                          />
                        </div>
                      );
                    }

                    // ODDS, EXTRA (Tied Match), and others
                    return (
                      <div key={market.eid || mIdx} id={`market-${name.replace(/\s+/g, '-')}`}>
                        <OddsTable
                          marketName={market.name}
                          marketData={market}
                          liveRates={liveRates}
                          selectedBet={selectedBet}
                          onCancelBet={() => setSelectedBet(null)}
                          onBetClick={(runner, side, price, runnerIndex, selectionId) => handleBetClick(runner, side, price, market.name, runnerIndex, market, selectionId)}
                          onCashout={handleCashout}
                          isCashoutLoading={cashoutLoading === (market.MarketId || market.marketid || market.eid)}
                          sport={sport}
                          isInPlay={isInPlay}
                        />
                      </div>
                    );
                  })}

                  {/* Grouped Line Markets */}
                  {lineMarkets.length > 0 && (
                    <div id="market-LINE-MARKET">
                      <OddsTable
                        marketName="LINE MARKET"
                        marketData={{
                          name: 'LINE MARKET',
                          runners: lineMarkets.map(m => ({
                            ...m,
                            RunnerName: m.name,
                            selectionId: m.eid || m.MarketId || m.marketid || 0
                          })),
                          Type: 'LINE'
                        }}
                        liveRates={liveRates}
                        selectedBet={selectedBet}
                        onCancelBet={() => setSelectedBet(null)}
                        onBetClick={(runner, side, price, runnerIndex, selectionId, mkt) => handleBetClick(runner, side, price, mkt?.name || 'Line Market', runnerIndex, mkt, selectionId)}
                        onCashout={(mId, mName, runners, mType) => handleCashout(matchId, mName, runners, mType)}
                        isCashoutLoading={cashoutLoading === matchId}
                        sport={sport}
                        isInPlay={isInPlay}
                        isGrouped={true}
                      />
                    </div>
                  )}

                  {/* Grouped Fancy Markets */}
                  {fancyMarkets.length > 0 && (
                    <div id="market-FANCY">
                      <FancyTable 
                        fancyData={fancyMarkets}
                        liveRates={liveRates}
                        selectedBet={selectedBet}
                        onCancelBet={() => setSelectedBet(null)}
                        onBetClick={(bet) => handleBetClick(bet.name, bet.side, bet.price, 'Fancy Bet', bet.runnerIndex, bet.marketData)}
                        matchId={matchId}
                        onOpenFancyChart={openFancyChart}
                      />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </EventLayout>

      {/* Fancy Chart Modal */}
      {fancyChartOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div 
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} 
            onClick={() => setFancyChartOpen(false)} 
          />
          <div style={{
            position: 'relative',
            zIndex: 1,
            background: '#fff',
            borderRadius: '8px',
            width: '100%',
            maxWIdth: '400px',
            maxWidth: '400px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              background: '#2b3a47',
              color: '#ffb400',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'between',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', textTransform: 'uppercase' }}>
                Chart: {fancyChartTitle}
              </h3>
              <button 
                onClick={() => setFancyChartOpen(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#fff', 
                  fontSize: '20px', 
                  cursor: 'pointer',
                  lineHeight: '1'
                }}
              >×</button>
            </div>
            
            <div style={{ padding: '0' }}>
              {fancyChartLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div className="animate-spin" style={{ 
                    width: '30px', 
                    height: '30px', 
                    border: '3px solid #f3f4f6', 
                    borderTopColor: '#ffb400', 
                    borderRadius: '50%',
                    margin: '0 auto 12px'
                  }}></div>
                  <p style={{ fontSize: '12px', color: '#666', fontWeight: '700' }}>LOADING LADDER...</p>
                </div>
              ) : fancyChartData?.error === '1' ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: '#d0021b', fontWeight: '700' }}>{fancyChartData.msg || 'Failed to load chart'}</p>
                </div>
              ) : (
                <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                      <tr>
                        <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '800', color: '#666', textTransform: 'uppercase' }}>Run</th>
                        <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '800', color: '#666', textTransform: 'uppercase', textAlign: 'right' }}>Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedChartData.map((row, idx) => {
                        const pos = parseFloat(row.position);
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f1f1' }}>
                            <td style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700', color: '#333' }}>{row.run}</td>
                            <td style={{ 
                              padding: '8px 16px', 
                              fontSize: '13px', 
                              fontWeight: '900', 
                              textAlign: 'right',
                              color: pos >= 0 ? '#2aa84a' : '#d0021b'
                            }}>
                              {pos > 0 ? `+${row.position}` : row.position}
                            </td>
                          </tr>
                        );
                      })}
                      {groupedChartData.length === 0 && (
                        <tr>
                          <td colSpan="2" style={{ padding: '30px', textAlign: 'center', color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                            No Ladder Data Available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div style={{ padding: '12px', borderTop: '1px solid #eee', background: '#fcfcfc' }}>
              <button 
                onClick={() => setFancyChartOpen(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#2b3a47',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: '800',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EventDetailedPage;
