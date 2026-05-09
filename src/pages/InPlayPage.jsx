import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useUIStore } from '../store/uiStore';
import RacingPanel from '../components/RacingPanel';
import Layout from '../components/Layout';
import BetSlip from '../components/BetSlip';
import { useNavigate } from 'react-router-dom';
import { marketController } from '../controllers';

const formatDateTime = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  const strTime = hours + ':' + minutes + ' ' + ampm;
  const day = date.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  return `${day} ${month} ${strTime}`;
};

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

function EventRow({ evt, odds, sportName }) {
  const navigate = useNavigate();
  const isLive = evt.status === 'In-Play';
  const matchOdds = odds[evt.marketId] || {};
  const status = (matchOdds.status || matchOdds.Status || '').toUpperCase();
  const isSuspended = status === 'SUSPENDED' || status === 'CLOSED';
  
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
    <tr style={{ position: 'relative', opacity: isSuspended ? 0.7 : 1 }}>
      <td className="col-event custom-pl">
        <span className="dot" style={{ display: isLive ? 'inline-block' : 'none' }}></span>

        <a 
          className="event-name" 
          href="#"
          onClick={(e) => {
            e.preventDefault();
            const s = (sportName || evt.sport || 'cricket').toLowerCase();
            navigate(`/${s}/${evt.id || evt.marketId}`);
          }}
        >
          {evt.name}
        </a>
        <div className="event-meta flex items-center gap-1 mt-0.5">
          <span style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>{formatDateTime(evt.startTimeRaw)}</span>
          {isLive && (
            <>
              <span className="mx-1">|</span>
              <span style={{color: '#2a9c39', fontWeight: 'bold', fontSize: '11px'}}>{evt.status}</span>
            </>
          )}
          
          <div className="flex items-center gap-1 ml-1">
            {isLive && evt.hasTV && (
              <div className="w-[18px] h-[15px] bg-[#3498db] rounded-[2px] flex items-center justify-center shadow-sm border border-[#2980b9]" title="Live TV">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
            )}
            {evt.hasBM && (
              <div className="px-1 h-[15px] bg-[#e67e22] rounded-[2px] flex items-center justify-center shadow-sm border border-[#d35400]" title="Bookmaker">
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>BM</span>
              </div>
            )}
            {evt.hasF && (
              <div className="w-[15px] h-[15px] bg-[#9b59b6] rounded-[2px] flex items-center justify-center shadow-sm border border-[#8e44ad]" title="Fancy">
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>F</span>
              </div>
            )}
            {evt.hasGoal && (
              <div className="w-[15px] h-[15px] bg-[#2ecc71] rounded-[2px] flex items-center justify-center shadow-sm border border-[#27ae60]" title="Goal">
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>G</span>
              </div>
            )}
            {evt.hasWset && (
              <div className="w-[15px] h-[15px] bg-[#f1c40f] rounded-[2px] flex items-center justify-center shadow-sm border border-[#f39c12]" title="Set">
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>S</span>
              </div>
            )}
          </div>

          {evt.hasE && <span className="tag tag-gray">E</span>}
          {evt.hasC && <span className="tag">C</span>}
          {evt.hasP && <span className="tag tag-orange">P</span>}
        </div>
      </td>

      <td className="col-odds-wrap" style={{ position: 'relative' }}>
        <div className="inplay-odds-grid">
          <div className="odds-pair">
            <div className="box back">{prices[0].back}</div>
            <div className="box lay">{prices[0].lay}</div>
          </div>
          <div className="odds-pair">
            <div className="box back">{prices[1].back}</div>
            <div className="box lay">{prices[1].lay}</div>
          </div>
          <div className="odds-pair">
            <div className="box back">{prices[2].back}</div>
            <div className="box lay">{prices[2].lay}</div>
          </div>
        </div>
        {isSuspended && (
            <div className="suspended-overlay">
                <span>SUSPENDED</span>
            </div>
        )}
      </td>
    </tr>
  );
}

function InPlayPage() {
  const [activeTab, setActiveTab] = useState('inplay');
  const [matches, setMatches] = useState([]);
  const [odds, setOdds] = useState({});
  const [loading, setLoading] = useState(false);
  const [collapsedSports, setCollapsedSports] = useState([]);
  const pollingRef = useRef(null);

  const toggleSport = (sport) => {
    setCollapsedSports(prev => 
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
  };

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await marketController.getGameList('Cricket,Football,Tennis,Horse Racing,Greyhound Racing');
        let matchData = [];
        if (res && res.matches) { // Some APIs return { matches: [] }
          matchData = res.matches;
        } else if (res && typeof res === 'object') {
          matchData = Object.values(res).filter(v => typeof v === 'object' && v !== null && (v.MarketId || v.marketid || v.Gid || v.gid));
        } else if (Array.isArray(res)) {
          matchData = res;
        }
        setMatches(matchData);
      } catch (err) {
        console.error('Failed to fetch matches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  // Polling for live rates
  useEffect(() => {
    if (matches.length === 0) return;

    const marketIds = matches
      .map(m => m.MarketId || m.marketid)
      .filter(id => !!id)
      .join(',');

    if (!marketIds) return;

    const fetchRates = async () => {
      try {
        // Only fetch rates for inplay matches or all if needed
        const res = await marketController.getLiveRates(marketIds);
        if (res && typeof res === 'object' && !res.error) {
           setOdds(prev => ({ ...prev, ...res }));
        }
      } catch (err) {
        console.error('Failed to fetch live rates:', err);
      }
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
  }, [matches, activeTab]);

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

  const getTimeGroups = () => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const inplay = {};
    const today = {};
    const tomorrow = {};

    matches.forEach(m => {
      let startTimeStr = m.DateTime || m.dateTime || m.Datetime || m.staredtime || m.StartTime || '';
      const startTime = parseDate(startTimeStr);

      if (!startTime) return;

      const isWinnerMarket = (m.Game_Type || m.GameType || '').toLowerCase() === 'winner' || 
                           (m.Team2 || '').includes('TOURNAMENT_WINNER');

      // 1. Expiry Check (Match markets expire 24h after start, Winner markets don't)
      const isExpired = !isWinnerMarket && (now.getTime() - startTime.getTime() > 24 * 60 * 60 * 1000);
      if (isExpired) return;

      const sport = m.sportname || m.Type || 'Other';
      const team1 = m.Team1 || m.team1;
      const team2 = m.Team2 || m.team2;
      const gName = m.Game_name || m.GameName || m.ename || m.name || m.Competition;
      
      let name = 'Match';
      if (team1 && team2) {
        name = team2 === 'TOURNAMENT_WINNER' ? team1 : `${team1} vs ${team2}`;
      } else if (gName) {
        name = gName;
      }

      const mId = m.MarketId || m.marketid;
      const id = m.gid || m.Gid || m.Event_Id || m.eid || mId;

      const evtObj = {
        id: id || Math.random(),
        marketId: mId,
        name,
        startTime: startTimeStr,
        startTimeRaw: startTime,
        hasE: false, 
        hasS: !!(m.hasS || m.s || m.isSuspended), 
        hasC: false, 
        hasF: !!(m.f || m.fancy || m.Fancy === 'Y'),
        hasP: false,
        hasBM: !!(m.bm || m.bookmaker || m.BM === 'Y'),
        hasTV: !!(m.tv || m.TV === 'Y' || m.isTV === 'Y'),
        hasGoal: m.Goal === 'Y' || m.goal === 'Y',
        hasWset: m.Wset === 'Y' || m.wset === 'Y',
        isWinner: isWinnerMarket
      };

      // 2. Tab Routing
      // Winner markets stay in 'In-Play' once they start, or even before if they are active outrights
      if (startTime <= now || isWinnerMarket) {
        if (!inplay[sport]) inplay[sport] = [];
        inplay[sport].push({ ...evtObj, status: 'In-Play' });
      } else if (startTime > now && startTime <= todayEnd) {
        if (!today[sport]) today[sport] = [];
        today[sport].push({ ...evtObj, status: startTimeStr.split(' ')[1] || startTimeStr });
      } else if (startTime > todayEnd) {
        if (!tomorrow[sport]) tomorrow[sport] = [];
        tomorrow[sport].push({ ...evtObj, status: startTimeStr.split(' ')[1] || startTimeStr });
      }
    });

    return { inplay, today, tomorrow };
  };

  const groupedMatches = useMemo(() => getTimeGroups(), [matches]);

  const renderGroup = (groupMap) => {
    const sportPriority = ['Cricket', 'Football', 'Tennis', 'Horse Racing', 'Greyhound Racing'];
    
    // Sort sports based on priority
    const sports = Object.keys(groupMap).sort((a, b) => {
      let idxA = sportPriority.indexOf(a);
      let idxB = sportPriority.indexOf(b);
      if (idxA === -1) idxA = 99;
      if (idxB === -1) idxB = 99;
      return idxA - idxB;
    });

    if (sports.length === 0) {
      return <div style={{ padding: '20px', fontWeight: '800' }}>No {loading ? 'events loading...' : 'events found'}</div>;
    }

    return sports.map((sport) => (
      <div key={sport} className="sport-block">
        <div 
          className="sport-head" 
          onClick={() => toggleSport(sport)} 
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>{sport} ({groupMap[sport].length})</span>
          <span className="sport-toggle" style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {collapsedSports.includes(sport) ? '+' : '-'}
          </span>
        </div>
        {!collapsedSports.includes(sport) && (
          <>
            {sport === 'Horse Racing' || sport === 'Greyhound Racing' ? (
              <RacingPanel sportType={sport} />
            ) : (
              <table className="inplay-table">
                <thead>
                  <tr>
                    <th className="col-event custom-pl">Event</th>
                    <th className="col-odds-header">
                        <div className="odds-grid-header">
                            <span>1</span>
                            <span>X</span>
                            <span>2</span>
                        </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupMap[sport].map((evt) => (
                    <EventRow key={evt.id} evt={evt} odds={odds} sportName={sport} />
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    ));
  };

  return (
    <Layout>
      <style>{`
        .inplay-odds-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
            width: 300px;
        }
        .odds-pair {
            display: flex;
            gap: 1px;
            border: 1px solid #ccc;
            height: 32px;
            border-radius: 2px;
            overflow: hidden;
            background: #fff;
        }
        .odds-pair .box {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 12px;
            cursor: pointer;
            min-width: 45px;
        }
        .odds-pair .box.back { background-color: #72bbef; color: #111; }
        .odds-pair .box.lay { background-color: #faa9ba; color: #111; }
        
        .odds-grid-header {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
            width: 300px;
            text-align: center;
        }
        .odds-grid-header span {
            font-weight: 900;
            color: #444;
            font-size: 11px;
        }
        .col-odds-header {
            width: 310px;
        }
        .col-odds-wrap {
            width: 310px;
        }
        
        .suspended-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(255, 255, 255, 0.7);
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            border: 1px solid #efeff4;
        }
        .suspended-overlay span {
            color: #d0021b;
            font-weight: 900;
            font-size: 11px;
            padding: 2px 6px;
            background: #fff;
            border: 1px solid #d0021b;
            border-radius: 2px;
            letter-spacing: 0.5px;
        }

        @media (max-width: 980px) {
            .col-odds-header, .col-odds-wrap, .right-area {
                display: none;
            }
            .left-area {
                width: 100% !important;
                margin-top: 10px; /* Added top gap */
            }
            .inplay-layout {
                min-height: calc(100vh - 50px);
            }
        }
      `}</style>
      <main className="main inplay-layout">
        <section className="left-area padding-btm">
          <div className="subtabs">
            <div className={`subtab ${activeTab === 'inplay' ? 'active' : ''}`} onClick={() => setActiveTab('inplay')}>In-Play</div>
            <div className={`subtab ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>Today</div>
            <div className={`subtab ${activeTab === 'tomorrow' ? 'active' : ''}`} onClick={() => setActiveTab('tomorrow')}>Tomorrow</div>
          </div>

          <div className="tab-content" style={{ display: activeTab === 'inplay' ? 'block' : 'none' }}>
            {renderGroup(groupedMatches.inplay)}
          </div>

          <div className="tab-content" style={{ display: activeTab === 'today' ? 'block' : 'none' }}>
            {renderGroup(groupedMatches.today)}
          </div>

          <div className="tab-content" style={{ display: activeTab === 'tomorrow' ? 'block' : 'none' }}>
             {renderGroup(groupedMatches.tomorrow)}
          </div>
        </section>

        <aside className="right-area">
          <BetSlip />
        </aside>
      </main>
    </Layout>
  );
}

export default InPlayPage;


