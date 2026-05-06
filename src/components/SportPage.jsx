import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import LeftSidebar from './LeftSidebar';
import BetSlip from './BetSlip';
import Footer from './Footer';
import { marketController } from '../controllers';
import RacingPanel from './RacingPanel';

const extractOdd = (runner) => {
  if (!runner) return { back: '--', lay: '--' };
  const bp = runner.back || runner.availableToBack || (runner.ex && runner.ex.availableToBack);
  const lp = runner.lay || runner.availableToLay || (runner.ex && runner.ex.availableToLay);
  const backPrices = Array.isArray(bp) ? bp : (bp ? Object.values(bp) : []);
  const layPrices = Array.isArray(lp) ? lp : (lp ? Object.values(lp) : []);
  const bestBack = backPrices[0];
  const bestLay = layPrices[0];
  return {
    back: bestBack ? (bestBack.price || bestBack.rate || '--') : (runner.lastPriceTraded || '--'),
    lay: bestLay ? (bestLay.price || bestLay.rate || '--') : '--'
  };
};

function MatchRow({ match, odds, sport }) {
  const isLive = match.status === 'In-Play';
  const matchOdds = odds[match.marketId] || {};
  const status = (matchOdds.status || matchOdds.Status || '').toUpperCase();
  const isSuspended = status === 'SUSPENDED' || status === 'CLOSED';
  const navigate = useNavigate();

  const rawRunners = matchOdds.runner || matchOdds.runners || [];
  const runnerArr = Array.isArray(rawRunners) ? rawRunners : Object.values(rawRunners);
  
  const rowOdds = [null, null, null];
  if (typeof rawRunners === 'object' && !Array.isArray(rawRunners)) {
    if (rawRunners["0"]) rowOdds[0] = extractOdd(rawRunners["0"]);
    if (rawRunners["1"]) rowOdds[1] = extractOdd(rawRunners["1"]);
    if (rawRunners["2"]) rowOdds[2] = extractOdd(rawRunners["2"]);
  } else {
    runnerArr.forEach((r, idx) => { if (idx < 3) rowOdds[idx] = extractOdd(r); });
  }
  
  if (rowOdds[0] && rowOdds[1] && !rowOdds[2]) {
    rowOdds[2] = rowOdds[1];
    rowOdds[1] = null;
  }
  
  const prices = rowOdds.map(o => o || { back: '--', lay: '--' });

  return (
    <div className="sports-row desktop-grid" style={{ position: 'relative', opacity: isSuspended ? 0.7 : 1 }}>
      <div className="col-event">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
          <span className="green-dot" style={{ display: isLive ? 'inline-block' : 'none' }}></span>
          {match.isWinner && (
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '-2px', fontWeight: 'bold' }}>
               {match.startTime}
            </div>
          )}
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              navigate(`/${sport.toLowerCase()}/${match.id || match.marketId}`);
            }} 
            className="event-link"
          >
            {match.name}
          </a>
        </div>
        <div className="event-sub flex items-center gap-1">
          <span style={{ color: isLive ? '#008000' : '#333', fontWeight: 'bold' }}>{match.status}</span>
          
          <div className="flex items-center gap-1 ml-1">
            {isLive && match.hasTV && (
              <div className="w-[18px] h-[15px] bg-[#3498db] rounded-[2px] flex items-center justify-center shadow-sm border border-[#2980b9]" title="Live TV">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
            )}
            {match.hasBM && (
              <div className="px-1 h-[15px] bg-[#e67e22] rounded-[2px] flex items-center justify-center shadow-sm border border-[#d35400]" title="Bookmaker">
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>BM</span>
              </div>
            )}
            {match.hasF && (
              <div className="w-[15px] h-[15px] bg-[#9b59b6] rounded-[2px] flex items-center justify-center shadow-sm border border-[#8e44ad]" title="Fancy">
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>F</span>
              </div>
            )}
            {match.hasGoal && (
              <div className="w-[15px] h-[15px] bg-[#2ecc71] rounded-[2px] flex items-center justify-center shadow-sm border border-[#27ae60]" title="Goal">
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>G</span>
              </div>
            )}
            {match.hasWset && (
              <div className="w-[15px] h-[15px] bg-[#f1c40f] rounded-[2px] flex items-center justify-center shadow-sm border border-[#f39c12]" title="Set">
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>S</span>
              </div>
            )}
          </div>
        </div>
      </div>



      <div className="col-odds" style={{ position: 'relative' }}>
          <div className="odds-box back">{prices[0].back}</div>
          <div className="odds-box lay">{prices[0].lay}</div>
          {isSuspended && <div className="suspended-overlay-grid"><span>SUSPENDED</span></div>}
      </div>

      <div className="col-odds" style={{ position: 'relative' }}>
        <div className="odds-box back">{prices[1].back}</div>
        <div className="odds-box lay">{prices[1].lay}</div>
        {isSuspended && <div className="suspended-overlay-grid"><span>SUSPENDED</span></div>}
      </div>

      <div className="col-odds" style={{ position: 'relative' }}>
        <div className="odds-box back">{prices[2].back}</div>
        <div className="odds-box lay">{prices[2].lay}</div>
        {isSuspended && <div className="suspended-overlay-grid"><span>SUSPENDED</span></div>}
      </div>
    </div>
  );
}

function SportPageWithLayout({
  sport,
  kvImage,
  countries = [],
}) {
  const [viewBy, setViewBy] = useState('Time');
  const [matches, setMatches] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [odds, setOdds] = useState({});
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef(null);

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

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await marketController.getGameList(sport);
        let matchData = [];
        if (res && res.matches) {
            matchData = res.matches;
        } else if (res && typeof res === 'object') {
          matchData = Object.values(res).filter(v => typeof v === 'object' && v !== null && (v.MarketId || v.marketid));
        }
        
        const now = new Date();
        const processed = matchData.map(m => {
            const startTimeStr = m.DateTime || m.dateTime || m.Datetime || m.staredtime || m.StartTime || '';
            const startTime = parseDate(startTimeStr);
            const isWinnerMarket = (m.Game_Type || m.GameType || '').toLowerCase() === 'winner' || (m.Team2 || '').includes('TOURNAMENT_WINNER');
            const team1 = m.Team1 || m.team1;
            const team2 = m.Team2 || m.team2;
            const gName = m.Game_name || m.GameName || m.ename || m.name || m.Competition;
            let name = 'Match';
            if (team1 && team2) name = team2 === 'TOURNAMENT_WINNER' ? team1 : `${team1} vs ${team2}`;
            else if (gName) name = gName;

            return {
                id: m.gid || m.Gid || m.Event_Id || m.eid || m.MarketId || Math.random(),
                marketId: m.MarketId || m.marketid,
                name,
                status: (startTime && startTime <= now) || isWinnerMarket ? 'In-Play' : (startTimeStr.split(' ')[1] || startTimeStr),
                startTime: startTimeStr,
                isWinner: isWinnerMarket,
                hasBM: !!(m.bm || m.bookmaker || m.BM === 'Y'),
                hasTV: !!(m.tv || m.TV === 'Y' || m.isTV === 'Y'),
                hasF: !!(m.f || m.fancy || m.Fancy === 'Y'),
                hasGoal: m.Goal === 'Y' || m.goal === 'Y',
                hasWset: m.Wset === 'Y' || m.wset === 'Y'
            };
        });
        setMatches(processed);
      } catch (err) {
        console.error('Failed to fetch matches:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCompetitions = async () => {
        try {
            const res = await marketController.getCompetitionList(sport);
            if (Array.isArray(res)) setCompetitions(res);
            else if (res && typeof res === 'object') {
                const list = Object.values(res).filter(v => typeof v === 'object' && v !== null && (v.Competition_Name || v.name));
                setCompetitions(list);
            }
        } catch (err) { }
    };

    fetchMatches();
    fetchCompetitions();
  }, [sport]);

  useEffect(() => {
    if (matches.length === 0) return;
    const marketIds = matches.map(m => m.marketId).filter(id => !!id).join(',');
    if (!marketIds) return;

    const fetchRates = async () => {
      try {
        const res = await marketController.getLiveRates(marketIds);
        if (res && typeof res === 'object' && !res.error) {
           setOdds(prev => ({ ...prev, ...res }));
        }
      } catch (err) { }
    };

    let isMounted = true;
    const poll = async () => {
      if (!isMounted) return;
      await fetchRates();
      pollingRef.current = setTimeout(poll, 1500);
    };
    poll();
    return () => {
      isMounted = false;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [matches]);

  return (
    <Layout>
      <style>{`
        .suspended-overlay-grid {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(255, 255, 255, 0.85);
            z-index: 5;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            border: 1px solid #ddd;
        }
        .suspended-overlay-grid span {
            color: #d00;
            font-weight: 900;
            font-size: 10px;
            background: #fff;
            padding: 1px 4px;
            border: 1px solid #d00;
            border-radius: 2px;
        }
      `}</style>
      <main className="main">
        <LeftSidebar sport={sport} competitions={competitions} countries={countries} />
        <div id="centerColumn" className="center">
          <div id="marqueeWrap" className="marquee-box1">
            <h4>News</h4>
            <div className="marquee">
              <p id="marqueeContent">Sports Update ● New Markets Available ● Place your bets now!</p>
            </div>
          </div>

          <div id="overWrap" className="over-wrap">
            {kvImage && <div className="banner1" style={{ backgroundImage: `url(${kvImage})` }}></div>}

            <div id="sportEvent" className="sports-highlights">
              <div className="sports-header">
                <span className="sports-title">{sport} Highlights</span>
              </div>

              {sport !== 'Horse Racing' && sport !== 'Greyhound Racing' && (
                <div className="sports-table-head desktop-grid">
                  <div className="col-event">Event</div>
                  <div className="col-odds-1" style={{ justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                  <div className="col-odds-1" style={{ justifyContent: 'center', fontWeight: 'bold' }}>X</div>
                  <div className="col-odds-1" style={{ justifyContent: 'center', fontWeight: 'bold' }}>2</div>
                </div>
              )}

              <div id="eventlistData">
                {sport === 'Horse Racing' || sport === 'Greyhound Racing' ? (
                  <RacingPanel sportType={sport} />
                ) : matches.length > 0 ? (
                  matches.map((m) => (
                    <MatchRow key={m.id} match={m} odds={odds} sport={sport} />
                  ))
                ) : (
                  <div className="no-item" style={{ textAlign: 'center', padding: '40px' }}>
                    {loading ? 'Loading matches...' : `No matches found for ${sport}`}
                  </div>
                )}
              </div>
            </div>
            <Footer />
          </div>
        </div>
        <div className="betslip">
          <BetSlip />
        </div>
      </main>
    </Layout>
  );
}

export default SportPageWithLayout;
