import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BetSlip from '../components/BetSlip';
import Layout from '../components/Layout';
import ScoreboardRender from '../components/EventDetailedPage/ScoreboardRender';
import OddsTable from '../components/EventDetailedPage/MatchTable/OddsTable';
import BookmakerTable from '../components/EventDetailedPage/MatchTable/BookmakerTable';
import FancyTable from '../components/EventDetailedPage/MatchTable/FancyTable';
import { marketController, bettingController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useRatePolling } from '../hooks/useRatePolling';
import { useSnackbarStore } from '../store/snackbarStore';
import { parseDate } from '../utils/format';

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

const EventDetailedPageMobile = () => {
  const { sport, matchId, eventId } = useParams();
  const navigate = useNavigate();
  const { loginToken, isLoggedIn } = useAuthStore();
  const openLoginModal = useUIStore(state => state.openLoginModal);
  const showSnackbar = useSnackbarStore(state => state.show);

  const [selectedBet, setSelectedBet] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreboardHtml, setScoreboardHtml] = useState(null);
  const [tvVisible, setTvVisible] = useState(false);
  const [tvHtml, setTvHtml] = useState(null);
  const [tvLoading, setTvLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('market'); // 'market' or 'bets'

  // Fancy Chart State
  const [fancyChartOpen, setFancyChartOpen] = useState(false);
  const [fancyChartLoading, setFancyChartLoading] = useState(false);
  const [fancyChartData, setFancyChartData] = useState(null);
  const [fancyChartTitle, setFancyChartTitle] = useState('');

  const groupedChartData = React.useMemo(() => {
    if (!fancyChartData || typeof fancyChartData !== 'object' || fancyChartData.error) return [];
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

  const { liveRates, scoreboardHtml: liveScoreboardHtml } = useRatePolling(matchId, gameData, 1000);

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
        res = await marketController.getGameDataLogin(loginToken, matchId);
      } else {
        res = await marketController.getGameData(matchId);
      }
      if (res && !res.error) {
        let parsed = typeof res === 'string' ? JSON.parse(res) : res;
        if (parsed && parsed["0"]) parsed = parsed["0"];
        setGameData(parsed);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [isLoggedIn, loginToken, matchId]);

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
      const eidToUse = gameData?.events?.['0']?.eid || gameData?.eid || matchId;
      const res = await marketController.toggleFavourite(loginToken, eidToUse.toString());
      if (res && res.error === '0') {
        showSnackbar(res.msg || 'Favourite updated', 'success');
      }
    } catch (err) { console.error(err); }
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
        const res = await marketController.getOpenTv(loginToken, eventId.toString());
        if (res.error === '0' && res.data) {
          setTvHtml(res.data);
          setTvVisible(true);
        } else {
          showSnackbar(res.msg || 'TV not available', 'info');
        }
      } catch (err) {
        console.error(err);
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
      fetchGameData(true);
      const interval = setInterval(() => fetchGameData(false), 5000);
      return () => clearInterval(interval);
    }
  }, [matchId, isLoggedIn, loginToken, fetchGameData]);

  const handleBetClick = (runner, type, price, market = 'Match Odds', runnerIndex, marketData, selectionId) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    setSelectedBet({ runner, type, price, market, runnerIndex, marketData, selectionId });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh] text-gray-500 font-bold">
          Loading...
        </div>
      </Layout>
    );
  }

  const startTimeStr = gameData?.DateTime || gameData?.dateTime || gameData?.Datetime || gameData?.staredtime || gameData?.StartTime || '';
  const startTime = parseDate(startTimeStr);
  const now = new Date();
  const isInPlay = gameData?.Inplay === 'true' || gameData?.Inplay === 'Y' || gameData?.Inplay === true ||
    (startTime && startTime <= now);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-[#f0f2f5]" style={{ paddingBottom: '80px' }}>
        {/* Header Row */}
        <div className="bg-[#253845] text-white p-3 flex items-center gap-3 sticky top-0 z-20 shadow-md">
          <button onClick={() => navigate(-1)} className="bg-[#ffb400] text-black font-black px-3 py-1 rounded text-xs uppercase">
            Back
          </button>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-sm font-black truncate leading-tight uppercase tracking-tighter">
              {gameData?.Game_name || `${gameData?.Team1} v ${gameData?.Team2}`}
            </h2>
            <div className="text-[10px] text-[#ffb400] font-bold">
              {formatDateTime(startTimeStr)}
            </div>
          </div>
          {isInPlay && (
            <span className="bg-[#2aa84a] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              Live
            </span>
          )}
        </div>

        {/* Scoreboard */}
        <div className="w-full">
          <ScoreboardRender
            html={scoreboardHtml}
            onPin={handleToggleFavourite}
            onRefresh={() => fetchGameData(false)}
            tvVisible={tvVisible}
            tvHtml={tvHtml}
            tvLoading={tvLoading}
            toggleTv={toggleTv}
          />
        </div>

        {/* Tabs Switcher */}
        <div className="bg-white border-b border-gray-200 flex sticky top-[52px] z-10 shadow-sm">
          <button 
            onClick={() => setActiveTab('market')}
            className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition-all ${activeTab === 'market' ? 'text-[#00508a] border-b-4 border-[#00508a]' : 'text-gray-500'}`}
          >
            Market
          </button>
          <button 
            onClick={() => setActiveTab('bets')}
            className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition-all ${activeTab === 'bets' ? 'text-[#00508a] border-b-4 border-[#00508a]' : 'text-gray-500'}`}
          >
            Bets
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-2">
          {activeTab === 'market' ? (
            <div className="space-y-3">
              {(() => {
                const eventList = Object.values(gameData?.events || {});
                const fancyMarkets = eventList.filter(e => e.Type === 'FANCY');
                const lineMarkets = eventList.filter(e => (e.Type === 'LINE' || (e.name && e.name.toUpperCase().includes('LINE'))));
                const otherMarkets = eventList.filter(e => e.Type !== 'FANCY' && e.Type !== 'LINE' && !(e.name && e.name.toUpperCase().includes('LINE')));

                return (
                  <>
                    {otherMarkets.map((market, mIdx) => {
                      const type = market.Type?.toUpperCase();
                      if (type === 'ODDS' || type === 'EXTRA' || type === 'GOAL' || type === 'GOALS' || type === 'WINNETSET') {
                        return (
                          <OddsTable
                            key={market.eid || mIdx}
                            marketData={market}
                            liveRates={liveRates}
                            selectedBet={selectedBet}
                            onCancelBet={() => setSelectedBet(null)}
                            onBetClick={(runner, side, price, runnerIdx, selId) => handleBetClick(runner, side, price, market.name, runnerIdx, market, selId)}
                            sport={sport}
                            isInPlay={isInPlay}
                            mobileView={true}
                          />
                        );
                      }
                      if (type === 'BOOKMAKER') {
                        return (
                          <BookmakerTable
                            key={market.eid || mIdx}
                            bookmakerData={market}
                            liveRates={liveRates}
                            selectedBet={selectedBet}
                            onCancelBet={() => setSelectedBet(null)}
                            onBetClick={(runner, side, price, runnerIdx) => handleBetClick(runner, side, price, market.name, runnerIdx, market)}
                            mobileView={true}
                          />
                        );
                      }
                      return null;
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
                          onBetClick={(runner, side, price, runnerIdx, selId, mkt) => handleBetClick(runner, side, price, mkt?.name || 'Line Market', runnerIdx, mkt, selId)}
                          sport={sport}
                          isInPlay={isInPlay}
                          isGrouped={true}
                          mobileView={true}
                        />
                      </div>
                    )}

                    {fancyMarkets.length > 0 && (
                      <FancyTable 
                        fancyData={fancyMarkets}
                        liveRates={liveRates}
                        selectedBet={selectedBet}
                        onCancelBet={() => setSelectedBet(null)}
                        onBetClick={(bet) => handleBetClick(bet.name, bet.side, bet.price, 'Fancy Bet', bet.runnerIndex, bet.marketData)}
                        matchId={matchId}
                        onOpenFancyChart={openFancyChart}
                        mobileView={true}
                      />
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white rounded shadow-sm overflow-hidden">
              <BetSlip sport={sport} />
            </div>
          )}
        </div>
      </div>

      {/* Fancy Chart Modal (simplified for mobile) */}
      {fancyChartOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFancyChartOpen(false)} />
          <div className="relative w-full bg-white rounded-t-xl overflow-hidden animate-slide-up max-h-[80vh] flex flex-col">
            <div className="bg-[#2b3a47] text-[#ffb400] p-4 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase">Ladder: {fancyChartTitle}</h3>
              <button onClick={() => setFancyChartOpen(false)} className="text-white text-2xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {fancyChartLoading ? (
                <div className="p-20 text-center text-gray-500 font-bold uppercase text-xs">Loading...</div>
              ) : (
                <table className="w-full text-left text-xs font-bold uppercase">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-3">Run</th>
                      <th className="p-3 text-right">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groupedChartData.map((row, idx) => {
                      const pos = parseFloat(row.position);
                      return (
                        <tr key={idx}>
                          <td className="p-3">{row.run}</td>
                          <td className={`p-3 text-right ${pos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pos > 0 ? `+${row.position}` : row.position}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-3 border-t bg-gray-50">
              <button onClick={() => setFancyChartOpen(false)} className="w-full py-3 bg-[#2b3a47] text-white font-black rounded uppercase text-xs">Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EventDetailedPageMobile;
