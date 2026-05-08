import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SportPageWithLayout from '../components/SportPage';
import RacingPanel from '../components/RacingPanel';
import { marketController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

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

function MobileMatchRow({ match, sport }) {
  const navigate = useNavigate();
  const isLive = match.status === 'In-Play';

  return (
    <div className="mobile-match-row" onClick={() => navigate(`/${sport.toLowerCase()}/${match.id}`)}>
      <div className="match-info-left">
        {/* Row 1: Event Name */}
        <div className="match-name-row">
          <span className="match-name">{match.name}</span>
        </div>

        {/* Row 2: Icons (TV, BM, F, G, S) */}
        <div className="match-icons">
          {match.hasTV && (
            <div className="m-icon-box tv" title="Live TV">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
          )}
          {match.hasBM && <div className="m-icon-box bm">BM</div>}
          {match.hasF && <div className="m-icon-box fancy">F</div>}
          {match.hasGoal && <div className="m-icon-box goal">G</div>}
          {match.hasWset && <div className="m-icon-box set">S</div>}
        </div>

        {/* Row 3: Time | Status */}
        <div className="match-status-row">
          <span className="match-time">{formatDateTime(parseDate(match.startTime))}</span>
          <span className="pipe">|</span>
          <span className={`match-status ${isLive ? 'inplay' : ''}`}>{match.status}</span>
        </div>
      </div>
    </div>
  );
}

function SportsPage() {
  const navigate = useNavigate();
  const openSearch = useUIStore(state => state.openSearch);
  const { loginToken } = useAuthStore();
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  const sports = [
    { name: 'Cricket' },
    { name: 'Football' },
    { name: 'Tennis' },
    { name: 'Horse Racing' },
    { name: 'Greyhound Racing' },
  ];

  const fetchData = async () => {
    try {
      const res = await marketController.getHomeBanners('Web');
      let dataArray = [];
      if (Array.isArray(res)) {
        dataArray = res;
      } else if (res && typeof res === 'object') {
        dataArray = Object.values(res).filter(item => item && typeof item === 'object' && item.image);
      }
      setBanners(dataArray);
    } catch (err) {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
    }
    return () => clearInterval(timerRef.current);
  }, [banners]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    resetTimer();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    resetTimer();
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
    }
  };

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        setLoading(true);
        // Fetching multiple sports at once to ensure everything is loaded
        const res = await marketController.getGameList('Cricket,Football,Soccer,Tennis');
        let matchData = [];
        if (res && res.matches) {
          matchData = res.matches;
        } else if (res && typeof res === 'object') {
          matchData = Object.values(res).filter(v => typeof v === 'object' && v !== null && (v.MarketId || v.marketid || v.gid || v.Gid));
        } else if (Array.isArray(res)) {
          matchData = res;
        }
        setAllMatches(matchData);
      } catch (err) {
        console.error('Failed to fetch all events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllEvents();
  }, []);

  const filteredMatches = useMemo(() => {
    const now = new Date();
    return allMatches
      .filter(m => {
        const sportName = (m.sportname || m.Type || m.sport || '').toLowerCase();
        const selected = selectedSport.toLowerCase();
        
        // Match specific sport or aliases
        if (selected === 'cricket') return sportName === 'cricket';
        if (selected === 'football') return sportName === 'football' || sportName === 'soccer';
        if (selected === 'tennis') return sportName === 'tennis';
        
        return false;
      })
      .map(m => {
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
          name,
          status: (startTime && startTime <= now) || isWinnerMarket ? 'In-Play' : (startTimeStr.split(' ')[1] || startTimeStr),
          startTime: startTimeStr,
          hasTV: !!(m.tv || m.TV === 'Y' || m.isTV === 'Y'),
          hasBM: !!(m.bm || m.bookmaker || m.BM === 'Y'),
          hasF: !!(m.f || m.fancy || m.Fancy === 'Y'),
          hasGoal: m.Goal === 'Y' || m.goal === 'Y',
          hasWset: m.Wset === 'Y' || m.wset === 'Y'
        };
      });
  }, [allMatches, selectedSport]);

  return (
    <>
      <div className="desktop-only">
        <SportPageWithLayout
          sport="Multi Markets"
          kvImage="/images/banner_sports.png"
        />
      </div>

      <div className="mobile-only">
        <Layout>
          <style>{`
            .mobile-sports-container {
              background: #f4f4f4;
              min-height: 100vh;
              margin-top: 10px;
            }
            .mobile-banner-wrap {
              width: 100%;
              overflow: hidden;
              position: relative;
            }
            .mobile-banner-img {
              width: 100%;
              display: block;
            }
            .sport-tabs-container {
              background: #ffb400;
              display: flex;
              align-items: center;
              padding: 0;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              border-bottom: 2px solid #2e4b5e;
              height: 44px;
            }
            .sport-tabs-container::-webkit-scrollbar { display: none; }
            .sport-tab-item {
              flex: 0 0 auto;
              display: flex;
              align-items: center;
              padding: 0 15px;
              height: 100%;
              font-size: 13px;
              font-weight: bold;
              color: #222;
              text-decoration: none;
              position: relative;
              cursor: pointer;
              transition: all 0.2s;
            }
            .sport-tab-item.active {
              background: #1a2a35;
              color: #ffb400;
            }
            .sport-tab-item .count-badge {
              position: absolute;
              top: 3px;
              right: 3px;
              background: #fff;
              color: #d00;
              font-size: 8px;
              padding: 1px 3px;
              border-radius: 4px;
              border: 1px solid #d00;
              font-weight: 900;
              line-height: 1;
            }
            .tab-search-icon {
              background: #333;
              width: 44px;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              margin-left: auto;
            }
            .highlights-bar {
              background: #1a2a35;
              color: #fff;
              text-align: center;
              padding: 8px 0;
              font-weight: bold;
              font-size: 14px;
              border-bottom: 1px solid #2e4b5e;
            }
            
            .mobile-match-list {
              background: #fff;
            }
            .mobile-match-row {
              padding: 10px 15px;
              border-bottom: 1px solid #f0f0f0;
              display: flex;
              flex-direction: column;
              gap: 5px;
            }
            .match-info-left {
              display: flex;
              flex-direction: column;
              gap: 4px;
              width: 100%;
            }
            .match-name-row {
              margin-bottom: 0px;
              width: 100%;
            }
            .match-name {
              color: #2b70b4;
              font-weight: 700;
              font-size: 14px;
              text-decoration: none;
              display: block;
            }
            .match-icons {
              display: flex;
              gap: 6px;
              margin-bottom: 0px;
              justify-content: flex-start;
              align-items: center;
              width: 100%;
            }
            .m-icon-box {
              height: 15px;
              min-width: 18px;
              width: fit-content;
              padding: 0 4px;
              border-radius: 2px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              font-weight: 900;
              color: #fff;
              box-shadow: 0 1px 2px rgba(0,0,0,0.1);
              margin: 0;
            }
            .m-icon-box.tv { background: #3498db; border: 1px solid #2980b9; }
            .m-icon-box.bm { background: #e67e22; border: 1px solid #d35400; }
            .m-icon-box.fancy { background: #9b59b6; border: 1px solid #8e44ad; }
            .m-icon-box.goal { background: #2ecc71; border: 1px solid #27ae60; }
            .m-icon-box.set { background: #f1c40f; border: 1px solid #f39c12; }

            .match-status-row {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 11px;
              color: #777;
              font-weight: 700;
              width: 100%;
            }
            .match-time {
               color: #a0522d;
            }
            .pipe { color: #ccc; }
            .match-status.inplay {
              color: #2a9c39;
            }

            .loading-text {
              text-align: center;
              padding: 40px 20px;
              color: #999;
              font-size: 13px;
            }
            /* Racing Overrides for Mobile */
            .mobile-match-list .racing-container {
              background: #fff;
              padding: 0;
            }
            .mobile-match-list .racing-tabs-header {
              background: #f0f0f0;
              padding: 5px 10px;
            }
            .mobile-match-list .time-btn {
              padding: 4px 8px;
              font-size: 11px;
            }
          `}</style>

          <div className="mobile-sports-container">
            <div className="mobile-banner-wrap" style={{ position: 'relative', width: '100%', height: 'auto', overflow: 'hidden', background: '#000' }}>
              {banners.length > 0 ? (
                <>
                  <div style={{
                    display: 'flex',
                    width: '100%',
                    transform: `translateX(-${currentIndex * 100}%)`,
                    transition: 'transform 0.5s ease-in-out'
                  }}>
                    {banners.map((banner, idx) => (
                      <div key={idx} style={{ width: '100%', flexShrink: 0 }}>
                        <img
                          src={banner.image}
                          alt={`Banner ${idx}`}
                          style={{ width: '100%', display: 'block', height: 'auto' }}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Indicators */}
                  <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
                    {banners.map((_, idx) => (
                      <div
                        key={idx}
                        onClick={() => { setCurrentIndex(idx); resetTimer(); }}
                        style={{
                          width: '8px', height: '8px', borderRadius: '50%', cursor: 'pointer',
                          background: currentIndex === idx ? '#ffb400' : 'rgba(255,255,255,0.5)'
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="sport-tabs-container">
              {sports.map((s) => (
                <div
                  key={s.name}
                  className={`sport-tab-item ${selectedSport === s.name ? 'active' : ''}`}
                  onClick={() => setSelectedSport(s.name)}
                >
                  {s.count && <span className="count-badge">{s.count}</span>}
                  {s.label || s.name}
                </div>
              ))}
              <div className="tab-search-icon" onClick={openSearch}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            <div className="highlights-bar">Highlights</div>

            <div className="mobile-match-list">
              {selectedSport === 'Horse Racing' || selectedSport === 'Greyhound Racing' ? (
                <RacingPanel key={selectedSport} sportType={selectedSport} />
              ) : loading ? (
                <div className="loading-text">Loading events...</div>
              ) : filteredMatches.length > 0 ? (
                filteredMatches.map((m) => (
                  <MobileMatchRow key={m.id} match={m} sport={selectedSport} />
                ))
              ) : (
                <div className="loading-text">No events found for {selectedSport}</div>
              )}
            </div>
          </div>
        </Layout>
      </div>
    </>
  );
}

export default SportsPage;
