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
          {isLive && (
            <>
              <span className="pipe">|</span>
              <span className="match-status inplay">{match.status}</span>
            </>
          )}
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
    { name: 'Cricket', icon: 'cricket' },
    { name: 'Football', icon: 'football' },
    { name: 'Tennis', icon: 'tennis' },
    { name: 'Horse Racing', icon: 'racing' },
    { name: 'Greyhound Racing', icon: 'dog' },
  ];

  const SportIcon = ({ name, active }) => {
    const color = active ? '#fff' : '#222';
    switch (name) {
      case 'cricket':
        return (
          <svg width="16" height="16" viewBox="0 0 25 25" fill={color}>
            <path d="M4.565 2.84c.505-.414 1.042-.79 1.608-1.123l15.66 19.1c-.436.487-.91.94-1.416 1.356L4.565 2.84zm-1.79 1.806l15.522 18.93C16.565 24.487 14.592 25 12.5 25 5.596 25 0 19.404 0 12.5c0-2.975 1.04-5.707 2.775-7.854zM8.557.636C9.797.222 11.122 0 12.5 0 19.404 0 25 5.596 25 12.5c0 2.252-.596 4.366-1.638 6.19L8.557.636z" />
          </svg>
        );
      case 'football':
        return (
          <svg viewBox="0 0 1024 1024" class="icon" width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M98.771701 928.915962a367.809154 578.401183 45 1 0 817.982797-817.982797 367.809154 578.401183 45 1 0-817.982797 817.982797Z" fill="#ffffff"></path><path d="M57.852177 600.000365l373.832003 373.832003s-200.000122 88.26589-333.54122-45.275209-62.305334-306.542243-40.290783-328.556794zM978.517327 428.453013l-373.832003-373.832004s200.000122-88.26589 333.54122 45.27521 62.305334 306.334558 40.290783 328.556794z" fill="#ffffff"></path><path d="M941.341811 82.65841c-153.894175-153.894175-471.651377-86.39673-708.411646 150.363539s-304.257714 554.517471-150.363539 708.411646 471.651377 86.39673 708.411646-150.363539 304.257714-554.517471 150.363539-708.411646z m-29.283507 29.283507c67.289761 67.289761 85.358307 171.131984 60.851543 285.566113L626.492191 51.090374c114.43413-24.506765 218.276353-6.230533 285.566113 60.851543z m-650.052316 150.363539a789.200896 789.200896 0 0 1 317.964887-198.546331l175.701041 175.701041-170.093561 170.093562-57.320907-57.320907a20.768445 20.768445 0 0 0-29.491192-2.699898l-2.492213 2.492213a20.768445 20.768445 0 0 0 2.699898 29.491192l57.320907 57.320907-45.067525 43.821418-57.320907-57.320907a20.768445 20.768445 0 0 0-29.491191-2.699898l-2.492214 2.492213a20.768445 20.768445 0 0 0 2.699898 29.491192l57.320907 57.320907-44.029102 44.029102-57.320908-57.320907a20.768445 20.768445 0 0 0-29.491191-2.699897l-2.492213 2.492213a20.768445 20.768445 0 0 0 2.699898 29.491191l57.320907 57.320907-167.393664 167.809033-177.154833-177.154833a792.523847 792.523847 0 0 1 197.923278-313.603513zM111.642449 911.942403c-68.120498-68.120498-85.981361-173.831881-60.020805-290.758224l349.740607 349.740607c-115.472552 27.414347-221.183935 9.138116-289.304433-58.982383z m158.878601-129.595094l167.601348-167.601348 57.320907 57.320907a20.768445 20.768445 0 0 0 29.491192 2.699898l2.492213-2.492214a20.768445 20.768445 0 0 0-2.699898-29.491191l-57.320907-57.320907 43.821418-44.029103 57.320907 57.320907a20.768445 20.768445 0 0 0 29.491192 2.699898l2.492213-2.492213a20.768445 20.768445 0 0 0-2.699898-29.491192l-57.320907-57.320907 44.029103-44.029102 57.320907 57.320907a20.768445 20.768445 0 0 0 29.491191 2.699898l2.492213-2.492214a20.768445 20.768445 0 0 0-2.699897-29.491191l-56.074801-58.567014 170.093562-170.093561 175.701041 175.701041A839.252847 839.252847 0 0 1 448.921989 959.502141z" fill="#000000"></path></g></svg>
        );
      case 'tennis':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
            <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
            <path d="M12 2a10 10 0 0 0-10 10M12 22a10 10 0 0 1 10-10" stroke={color} strokeWidth="2" fill="none" />
          </svg>
        );
      case 'racing':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
            <path d="M19 19.133S25.21 0 9.41 0h-.095C-3.915 0 2.326 19.133 2.326 19.133L0 20.753l1.794 4.156 7.236-2.752c-6.875-14.115 1.578-14.911 2.888-14.95 1.31.04 9.764.836 2.888 14.974l7.236 2.75 1.794-4.156-2.325-1.62z" />
          </svg>
        );
      case 'dog':
        return (
          <svg fill="#000000" width="16" height="16" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 489.5 489.5" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M489.092,95.424c-0.74-2.151-2.417-3.85-4.558-4.619L448.166,77.75l-6.111-10.864c-2.028-3.603-5.511-6.153-9.558-6.996 l-34.898-7.271c-9.146-1.905-18.379,1.902-23.524,9.7l-50.962,77.239c-3.597,5.452-9.366,9.164-15.827,10.183 c-24.598,3.88-72.476,10.233-116.691,9.187c-21.268-0.502-41.948,2.683-61.497,9.47c-6.079,2.111-11.773,4.468-17.078,7.058 c-9.855-0.573-67.852-2.281-76.578,35.894c-8.14,35.615,17.475,71.732,21.829,77.538c-0.011,0.381-0.022,0.771-0.032,1.143 c-0.616,22-0.71,25.381-16.031,34.362C11.697,341.694,4.18,351.421,3.42,352.474c-0.882,1.221-1.376,2.68-1.417,4.186l-2,73 c-0.056,2.024,0.709,3.984,2.122,5.436s3.351,2.27,5.375,2.27H39c2.411,0,4.675-1.159,6.084-3.115s1.793-4.47,1.03-6.757 l-0.775-2.324c-2.147-6.441-6.809-11.663-12.761-14.586c0.664-15.354,5.243-44.048,21.675-51.96 c7.675-3.695,17.572-8.921,27.917-15.587c1.612,7.482,1.91,14.457,0.853,20.794c-0.681,4.086,2.079,7.95,6.165,8.631 c0.417,0.069,0.833,0.103,1.242,0.103c3.6,0,6.778-2.6,7.389-6.268c1.66-9.958,0.821-20.86-2.485-32.433 c2.167-1.638,4.322-3.336,6.448-5.095c18.831-15.59,31.075-32.315,36.39-49.711c1.408-4.609,5.204-15.606,5.874-16.885 c3.133-5.982,8.345-10.634,14.774-13.064c6.921-2.615,14.743-2.336,21.46,0.763l73.956,34.133 c18.53,8.552,38.918,13.173,59.333,13.511c9.35,43.911,4.703,77.19,2.468,88.704c-1.127,5.803-0.301,11.892,2.326,17.145 l13.928,27.855c1.271,2.541,3.867,4.146,6.708,4.146h30c2.686,0,5.166-1.436,6.503-3.765c1.338-2.329,1.328-5.195-0.025-7.515 l-2.938-5.036c-2.85-4.886-7.39-8.583-12.654-10.451l-4.318-13.672l6.092-102.703c0.394-6.637,2.44-12.989,5.917-18.368 c7.632-11.808,16.589-32.349,15.92-63.154c-0.791-36.403,23.373-77.516,30.991-89.542l40.421,2.343 c11.75,0.684,22.978-5.083,29.27-15.044l4.161-6.588C489.556,99.946,489.832,97.576,489.092,95.424z M50.064,214.694 c3.479-15.22,21.59-21.04,37.362-23.183c-14.367,12.587-23.144,28.16-25.844,46.246c-1.379,9.242-2.288,17.371-2.908,24.577 C52.289,249.496,46.199,231.603,50.064,214.694z M455.778,108.528l-44.758-2.595c-4.017-0.233-7.791-2.146-10.354-5.249 l-7.504-9.084c-2.639-3.193-7.365-3.644-10.559-1.005c-3.193,2.638-3.644,7.366-1.005,10.559l7.504,9.083 c2.68,3.245,6.015,5.843,9.73,7.672c-10.319,17.088-31.132,56.265-30.33,93.118c0.617,28.425-8.207,46.463-13.521,54.686 c-4.878,7.548-7.746,16.408-8.293,25.622l-6.174,104.085c-0.054,0.914,0.059,1.83,0.335,2.703l6,19 c0.4,1.267,1.117,2.375,2.053,3.242h-5.266l-11.855-23.709c-1.156-2.312-1.517-5.003-1.017-7.578 c4.214-21.712,10.615-79.914-20.903-151.244c-1.674-3.789-6.103-5.5-9.892-3.829c-3.789,1.674-5.503,6.103-3.829,9.892 c5.901,13.355,10.377,26.254,13.742,38.496c-17.012-0.792-33.906-4.876-49.36-12.007l-73.956-34.133 c-10.345-4.775-22.39-5.203-33.049-1.175c0,0-0.001,0-0.001,0c2.629-6.518,4.225-9.926,4.263-10.004 c1.771-3.743,0.173-8.212-3.569-9.985c-3.743-1.774-8.215-0.176-9.988,3.567c-0.377,0.796-9.361,19.91-20.395,56.019 c-3.641,11.917-18.343,42.635-76.081,70.435c-30.983,14.917-30.29,68.625-30.245,70.904c0.053,2.687,1.526,5.069,3.755,6.353h-6.048 l1.713-62.521c3.102-3.085,11.849-10.771,31.872-22.508c22.496-13.188,22.792-23.747,23.439-46.883 c0.326-11.652,0.772-27.611,4.186-50.48c3.907-26.175,23.286-45.488,57.6-57.402c17.848-6.196,36.761-9.105,56.222-8.644 c45.406,1.076,94.287-5.407,119.384-9.366c10.616-1.675,20.096-7.776,26.01-16.739l50.962-77.239 c1.622-2.459,4.451-3.721,7.333-3.356l-1.43,1.544c-2.815,3.039-2.633,7.784,0.405,10.599c1.443,1.337,3.271,1.998,5.095,1.998 c2.016,0,4.026-0.808,5.504-2.403l7.601-8.206l18.031,3.757l2.07,3.679c-2.942,1.326-4.798,4.463-4.35,7.826 c0.502,3.77,3.723,6.51,7.425,6.51c0.33,0,0.664-0.022,1-0.067l6.903-0.92l28.415,10.2 C467.111,106.29,461.563,108.863,455.778,108.528z"></path> </g></svg>
        );
      default:
        return null;
    }
  };

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
    } catch (err) { }
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

  const matchCounts = useMemo(() => {
    const counts = {
      Cricket: 0,
      Football: 0,
      Tennis: 0,
      'Horse Racing': 0,
      'Greyhound Racing': 0
    };
    const now = new Date();
    allMatches.forEach(m => {
      const sportName = (m.sportname || m.Type || m.sport || '').toLowerCase();
      const startTimeStr = m.DateTime || m.dateTime || m.Datetime || m.staredtime || m.StartTime || '';
      const startTime = parseDate(startTimeStr);
      const isWinnerMarket = (m.Game_Type || m.GameType || '').toLowerCase() === 'winner' || (m.Team2 || '').includes('TOURNAMENT_WINNER');

      if ((startTime && startTime <= now) || isWinnerMarket) {
        if (sportName === 'cricket') counts.Cricket++;
        else if (sportName === 'football' || sportName === 'soccer') counts.Football++;
        else if (sportName === 'tennis') counts.Tennis++;
        else if (sportName === 'horse racing') counts['Horse Racing']++;
        else if (sportName === 'greyhound racing') counts['Greyhound Racing']++;
      }
    });
    return counts;
  }, [allMatches]);

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
              align-items: flex-end;
              padding: 0 5px;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              height: 48px;
              gap: 5px;
            }
            .sport-tabs-container::-webkit-scrollbar { display: none; }
            .sport-tab-item {
              flex: 0 0 auto;
              display: flex;
              align-items: center;
              padding: 0 12px;
              height: 38px;
              font-size: 13px;
              font-weight: bold;
              color: #222;
              text-decoration: none;
              position: relative;
              cursor: pointer;
              transition: all 0.2s;
              border-radius: 8px 8px 0 0;
              background: transparent;
            }
            .sport-tab-item.active {
              background: #111;
              color: #fff;
            }
            .tag-live {
              background: linear-gradient(180deg, #fb3434 0%, #e80505 100%);
              border-radius: 3px;
              color: #fff;
              display: inline-flex;
              align-items: center;
              font-size: 9px;
              font-weight: 700;
              line-height: 12px;
              padding-right: 4px;
              position: absolute;
              top: -6px;
              right: 2px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              z-index: 10;
            }
            .tag-live strong {
              background: linear-gradient(180deg, #ffffff 0%, #eeeeee 89%);
              border-radius: 2px 0 0 2px;
              color: #d0021b;
              display: inline-flex;
              align-items: center;
              margin: 1px 3px 1px 1px;
              padding: 0 1px;
              height: 10px;
            }
            .tag-live strong:before {
              content: "";
              display: inline-block;
              width: 10px;
              height: 6px;
              background: url('data:image/svg+xml,<svg width="14" height="8" xmlns="http://www.w3.org/2000/svg"><g fill="rgb(255,0,0)" fill-rule="evenodd"><path d="M12.012 0l-.698.727c1.734 1.808 1.734 4.738 0 6.546l.698.727c2.117-2.207 2.117-5.79 0-8zM10.3 1.714l-.7.735c.967 1.014.967 2.66 0 3.673l.7.735c1.352-1.418 1.352-3.721 0-5.143zM1.588 0l.698.727c-1.734 1.808-1.734 4.738 0 6.546L1.588 8c-2.117-2.207-2.117-5.79 0-8zM3.3 1.714l.7.735c-.967 1.014-.967 2.66 0 3.673l-.7.735c-1.352-1.418-1.352-3.721 0-5.143z"/><circle cx="6.8" cy="4.4" r="1.6"/></g></svg>') no-repeat;
              background-size: contain;
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

                </>
              ) : null}
            </div>

            <div className="sport-tabs-container">
              {sports.map((s) => (
                <div
                  key={s.name}
                  className={`sport-tab-item ${selectedSport === s.name ? 'active' : ''}`}
                  onClick={() => setSelectedSport(s.name)}
                  style={{ gap: '6px' }}
                >
                  <SportIcon name={s.icon} active={selectedSport === s.name} />
                  <span className="tag-live">
                    <strong></strong>
                    {matchCounts[s.name] || 0}
                  </span>
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
