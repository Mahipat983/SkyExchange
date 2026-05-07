import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authController, userController, marketController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useSnackbarStore } from '../store/snackbarStore';
import { useUIStore } from '../store/uiStore';
import EditStakeModal from './EditStakeModal';

function DesktopHeader() {
  const { openLoginModal, openSignupModal } = useUIStore();
  const [validationCode, setValidationCode] = useState('');
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [validationInput, setValidationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isEditStakeModalOpen, setIsEditStakeModalOpen] = useState(false);
  const [matchCounts, setMatchCounts] = useState({
    Cricket: 0,
    Football: 0,
    Tennis: 0,
    'Horse Racing': 0,
    'Greyhound Racing': 0
  });

  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, username, loginToken, logout, balance, exposure } = useAuthStore();
  const loginAction = useAuthStore((state) => state.login);
  const showSnackbar = useSnackbarStore(state => state.show);

  const generateCode = () => {
    return String(Math.floor(1000 + Math.random() * 9000));
  };

  // refreshBalance is now handled by SessionWatchdog
  const refreshBalance = () => {
    // No-op or trigger watchdog if needed, but watchdog is automatic
  };

  useEffect(() => {
    if (searchInput.length > 0) {
      setSearchLoading(true);
      setShowSearchResults(true);
    } else {
      setSearchLoading(false);
      setShowSearchResults(false);
      setSearchResults([]);
    }

    const timer = setTimeout(() => {
      if (searchInput.length >= 3) {
        performSearch(searchInput);
      } else {
        setSearchResults([]);
        // Keep loader visible if user is typing but less than 3 chars
        if (searchInput.length > 0) {
          setSearchLoading(false); // Stop loader if < 3 chars after debounce
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const performSearch = async (val) => {
    const token = useAuthStore.getState().getToken() || '';

    try {
      setSearchLoading(true);
      const res = await marketController.search(token, val);
      if (Array.isArray(res)) {
        setSearchResults(res);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    setValidationCode(generateCode());
  }, []);

  // Polling removed here as it is handled by SessionWatchdog

  const validateLogin = async (e) => {
    e.preventDefault();
    if (!loginName.trim()) { showSnackbar('Username is empty', 'error'); return; }
    if (!password.trim()) { showSnackbar('Password is empty', 'error'); return; }
    if (validationInput.trim() !== validationCode) {
      showSnackbar('Invalid Validation Code!', 'error');
      setValidationCode(generateCode());
      setValidationInput('');
      return;
    }

    try {
      setLoading(true);
      const response = await authController.login({
        username: loginName,
        password: password,
        ip: '127.0.0.1'
      });

      if (response.error === '0') {
        const token = response.LoginToken || response.apitoken || response.token;
        loginAction(response.username || loginName, token);
        showSnackbar('Login Successful', 'success');
        setLoginName('');
        setPassword('');
        setValidationInput('');
        setValidationCode(generateCode());
      } else {
        showSnackbar(response.msg || 'Login failed.', 'error');
        setValidationCode(generateCode());
        setValidationInput('');
      }
    } catch (error) {
      console.error('Desktop Login Error:', error);
      showSnackbar('Network or unexpected error during login.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchCounts = async () => {
    try {
      // Fetching live counts for all major sports
      const sports = ['Cricket', 'Football', 'Tennis', 'Horse Racing', 'Greyhound Racing'];
      const res = await marketController.getGameList(sports.join(','));

      let matchData = [];
      if (res && res.matches) {
        matchData = res.matches;
      } else if (res && typeof res === 'object') {
        matchData = Object.values(res).filter(v => typeof v === 'object' && v !== null && (v.MarketId || v.marketid || v.Gid || v.gid));
      } else if (Array.isArray(res)) {
        matchData = res;
      }

      const counts = {
        Cricket: 0,
        Football: 0,
        Tennis: 0,
        'Horse Racing': 0,
        'Greyhound Racing': 0
      };

      const now = new Date();
      matchData.forEach(m => {
        const sport = m.sportname || m.Type || m.sport || 'Other';
        const startTimeStr = m.DateTime || m.dateTime || m.Datetime || m.staredtime || m.StartTime || '';
        const startTime = parseDate(startTimeStr);
        const isWinnerMarket = (m.Game_Type || m.GameType || '').toLowerCase() === 'winner' ||
          (m.Team2 || '').includes('TOURNAMENT_WINNER');

        // Count as "Live" if it has started or is a winner market
        if ((startTime && startTime <= now) || isWinnerMarket) {
          if (sport === 'Cricket') counts.Cricket++;
          else if (sport === 'Football' || sport === 'Soccer') counts.Football++;
          else if (sport === 'Tennis') counts.Tennis++;
          else if (sport === 'Horse Racing') counts['Horse Racing']++;
          else if (sport === 'Greyhound Racing') counts['Greyhound Racing']++;
        }
      });

      setMatchCounts(counts);
    } catch (err) {
      console.error('Failed to fetch match counts:', err);
    }
  };

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
    fetchMatchCounts();
    const timer = setInterval(fetchMatchCounts, 60000); // Refresh every minute
    return () => clearInterval(timer);
  }, []);

  const isActive = (path) => {
    const current = location.pathname;
    if (path === '/' && (current === '/' || current === '/index')) return true;
    if (path !== '/' && current.startsWith(path)) return true;
    return false;
  };

  const openOverlay = useUIStore(state => state.openOverlay);

  const handlePremiumSportsbook = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    try {
      const res = await marketController.getSportsbook(loginToken);
      if (res && res.error === '0' && res.url) {
        openOverlay(res.url, 'Premium Sportsbook');
      } else {
        showSnackbar(res?.msg || 'Failed to open sportsbook', 'error');
      }
    } catch (err) {
      console.error(err);
      showSnackbar('Error opening sportsbook', 'error');
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div className="top">
        <div className="header full-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <Link to="/">SKYEXCHANGE</Link>
            </h1>
            <div id="searchWrap" style={{ display: 'flex', alignItems: 'center', margin: 0, height: '100%', position: 'relative' }}>
              <div className="custom-search-container" style={{ 
                position: 'relative', 
                display: 'flex', 
                alignItems: 'center',
                width: '300px',
                height: '30px',
                background: '#fff',
                borderRadius: '4px',
                border: '1px solid #ccc',
                padding: '0 8px',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search Events"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => searchInput.length >= 3 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    height: '100%',
                    background: 'transparent',
                    padding: 0,
                    margin: 0,
                    boxShadow: 'none'
                  }}
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#999'
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
              {showSearchResults && searchInput.length > 0 && (
                <div
                  className="suggestion-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '350px',
                    background: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    zIndex: 1100,
                    marginTop: '5px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}
                >
                  <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                    {searchLoading && (
                      <li style={{ padding: '12px', color: '#666', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #ccc', borderTopColor: '#ffb400', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                        Searching...
                      </li>
                    )}
                    {!searchLoading && searchInput.length < 3 && (
                      <li style={{ padding: '12px', color: '#999', fontSize: '12px' }}>Please enter at least 3 characters...</li>
                    )}
                    {!searchLoading && searchInput.length >= 3 && searchResults.length === 0 && (
                      <li style={{ padding: '12px', color: '#999', fontSize: '13px' }}>No events found for "{searchInput}"</li>
                    )}
                    {!searchLoading && searchInput.length >= 3 && searchResults.map((res, index) => {
                      // Extract time from Datetime (e.g., "2022-04-13 19:30:00" -> "19:30")
                      const time = res.Datetime ? res.Datetime.split(' ')[1]?.substring(0, 5) : '--:--';
                      return (
                        <li key={res.Gid || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <Link
                            to={`/${res.Type.toLowerCase()}/${res.Gid}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '10px 15px',
                              textDecoration: 'none',
                              color: '#333',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            onClick={() => {
                              setSearchInput('');
                              setSearchResults([]);
                              setShowSearchResults(false);
                            }}
                          >
                            <span style={{ fontSize: '13px', color: '#444', fontWeight: 'bold', minWidth: '40px' }}>{time}</span>
                            <span style={{ fontSize: '13px', color: '#333' }}>{res.GameName}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {!isLoggedIn ? (
            <ul className="login-wrap">
              <li className="user error">
                <input type="text" placeholder="Username" value={loginName} onChange={(e) => setLoginName(e.target.value)} />
              </li>
              <li>
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </li>
              <li style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Validation"
                  value={validationInput}
                  onChange={(e) => setValidationInput(e.target.value)}
                  style={{ paddingRight: '60px' }}
                />
                <span style={{
                  position: 'absolute',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  top: '50%',
                  right: '10px',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  background: '#eee',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  letterSpacing: '1px'
                }}>
                  {validationCode}
                </span>
              </li>
              <li className="li-login">
                <a className="btn-login" onClick={validateLogin} style={{ cursor: 'pointer' }}>{loading ? '...' : 'Login'}<img className="icon-login" src="/images/transparent.gif" alt="" /></a>
              </li>
              <li className="li-signup">
                <a 
                  className="btn-signup" 
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.preventDefault();
                    openSignupModal();
                  }}
                >
                  Sign up
                  <img className="icon-login" src="/images/transparent.gif" alt="" />
                </a>
              </li>
            </ul>
          ) : (
            <div className="account-section" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="action-buttons" style={{ display: 'flex', gap: '6px' }}>
                <Link
                  to="/wallet/deposit"
                  style={{
                    background: '#1e8000',
                    color: '#fff',
                    border: '1px solid #fff',
                    borderRadius: '4px',
                    padding: '0 10px',
                    height: '32px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    textDecoration: 'none'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h2v2h4v-2c2-1.5 2-2.7 2-4.5 0-5.3-7.5-6.5-11-5" />
                    <circle cx="12" cy="3" r="1.5" />
                  </svg>
                  DEPOSIT
                </Link>
                <Link
                  to="/wallet/withdrawal"
                  style={{
                    background: '#b80000',
                    color: '#fff',
                    border: '1px solid #fff',
                    borderRadius: '4px',
                    padding: '0 10px',
                    height: '32px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    textDecoration: 'none'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 5l-5 5-3-3-4 4" />
                    <polyline points="13 5 18 5 18 10" />
                    <path d="M2 18h16l2 2H4l-2-2z" />
                  </svg>
                  WITHDRAWAL
                </Link>
              </div>
              <div className="balance-container" style={{ position: 'relative' }}>
                <div
                  className="balance-bar"
                  style={{ display: 'flex', alignItems: 'center', background: 'linear-gradient(to bottom, #444, #222)', border: '1px solid #555', borderRadius: '4px', padding: '2px', height: '32px', cursor: 'pointer', boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,.5)' }}
                  onClick={() => setIsBalanceModalOpen(!isBalanceModalOpen)}
                >
                  <div className="balance-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 10px', borderRight: '1px solid #555' }}>
                    <span style={{ fontSize: '12px', color: '#ffb400' }}>Main Balance <strong style={{ color: '#ffb400' }}>PTH {balance}</strong></span>
                    <span style={{ fontSize: '12px', color: '#ffb400' }}>Exposure <strong style={{ color: '#ffb400' }}>{exposure}</strong></span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); /* Refresh handled by watchdog */ }} style={{ background: 'none', border: 'none', color: '#ffb400', width: '30px', cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path></svg>
                  </button>
                </div>
                {isBalanceModalOpen && (
                  <div 
                    className="balance-modal-content" 
                    style={{ position: 'absolute', top: '36px', right: '0', background: '#ecf0f1', width: '320px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 1001, cursor: 'pointer' }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/bets');
                      setIsBalanceModalOpen(false);
                    }}
                  >
                    <div style={{ padding: '15px' }}>
                      <div style={{ background: '#fff', borderRadius: '4px', padding: '12px', marginBottom: '10px', border: '1px solid #ddd' }}>
                        <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>Main Balance</p>
                        <p style={{ margin: '5px 0', fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}><span style={{ color: '#7f8c8d', fontSize: '14px', marginRight: '5px' }}>PTH</span> {balance}</p>
                        <div style={{ borderTop: '1px solid #eee', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: '#666' }}>Exposure</span>
                          <span style={{ fontSize: '13px', color: '#333' }}>{exposure}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setIsBalanceModalOpen(false)} style={{ width: '100%', background: '#fff', border: 'none', borderTop: '1px solid #ddd', padding: '12px', fontSize: '15px', fontWeight: 'bold', color: '#333', cursor: 'pointer' }}>Close</button>
                  </div>
                )}
              </div>
              <div className="account-dropdown-container" style={{ position: 'relative' }}>
                <button onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} onBlur={() => setTimeout(() => setIsAccountMenuOpen(false), 200)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(to bottom, #444, #222)', border: '1px solid #555', borderRadius: '4px', padding: '0 10px', height: '32px', color: '#ffb400', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,.5)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
                  My Account <span style={{ fontSize: '10px' }}>▼</span>
                </button>
                {isAccountMenuOpen && (
                  <div className="account-menu" style={{ position: 'absolute', top: '36px', right: '0', width: '240px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 1000, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee', background: '#f9f9f9' }}>
                      <span style={{ fontWeight: 'bold', color: '#333' }}>{username}</span><span style={{ fontSize: '11px', color: '#666' }}>GMT+5:30</span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                      {[{ label: 'My Profile', to: '/profile' }, { label: 'Balance Overview', to: '/balance-overview' }, { label: 'Account Statement', to: '/statement' }, { label: 'Offers', to: '/offers' }, { label: 'My Bets', to: '/bets?tab=current' }, { label: 'Bets History', to: '/bets?tab=history' }, { label: 'Profit & Loss', to: '/bets?tab=pnl' }].map((item) => (
                        <li key={item.label} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <Link to={item.to} style={{ display: 'block', padding: '10px 15px', textDecoration: 'none', color: '#333', fontSize: '13px' }} onClick={() => setIsAccountMenuOpen(false)}>{item.label}</Link>
                        </li>
                      ))}
                    </ul>
                    <div style={{ padding: '10px' }}>
                      <button onClick={() => logout()} style={{ width: '100%', background: '#7c8e9d', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        LOGOUT
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="menu-wrap">
          <div className="full-wrap">
            <ul id="tabMenu" className="menu nav nav-pills">
              <li><Link to="/" className={isActive('/') ? 'active-menu' : ''}>Home</Link></li>
              <li><Link to="/in-play">In-Play</Link></li>
              <li>
                <Link
                  to={isLoggedIn ? "/multi-markets" : "#"}
                  className="red-gradient-btn"
                  onClick={(e) => {
                    if (!isLoggedIn) {
                      e.preventDefault();
                      openLoginModal();
                    }
                  }}
                >
                  Multi Markets
                </Link>
              </li>
              <li><Link to="/cricket" className={isActive('/cricket') ? 'active-menu' : ''}><span className="tag-live"><strong></strong>{matchCounts.Cricket}</span>Cricket</Link></li>
              <li><Link to="/football" className={isActive('/football') ? 'active-menu' : ''}><span className="tag-live"><strong></strong>{matchCounts.Football}</span>Football</Link></li>
              <li><Link to="/tennis" className={isActive('/tennis') ? 'active-menu' : ''}><span className="tag-live"><strong></strong>{matchCounts.Tennis}</span>Tennis</Link></li>
              <li><Link to="/horse-racing" className={isActive('/horse-racing') ? 'active-menu' : ''}><span className="tag-live"><strong></strong>{matchCounts['Horse Racing']}</span>Horse Racing</Link></li>
              <li><Link to="/greyhound-racing" className={isActive('/greyhound-racing') ? 'active-menu' : ''}><span className="tag-live"><strong></strong>{matchCounts['Greyhound Racing']}</span>Greyhound Racing</Link></li>
              <li>
                <Link
                  id="menu_Casino"
                  to={isLoggedIn ? "/casino" : "#"}
                  className={`casino tag-new ${isActive('/casino') ? 'active-menu' : ''}`}
                  onClick={(e) => {
                    if (!isLoggedIn) {
                      e.preventDefault();
                      openLoginModal();
                    }
                  }}
                >
                  Casino
                </Link>
              </li>
              <li><Link to="/offers" className={isActive('/offers') ? 'active-menu' : ''}>Offers</Link></li>
              <li><a href="#" className="red-gradient-btn" onClick={handlePremiumSportsbook}>Premium sportBook</a></li>
            </ul>
            <ul className="setting-wrap" style={{ display: 'flex', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
              <li className="time_zone" style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}><span>Time Zone :</span> GMT+5:30</li>
              <li style={{ display: 'flex', alignItems: 'center' }}>
                <a 
                  className="setting" 
                  onClick={() => {
                    if (!isLoggedIn) {
                      openLoginModal();
                    } else {
                      setIsEditStakeModalOpen(true);
                    }
                  }} 
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}
                >
                  Setting <img src="/images/transparent.gif" alt="" style={{ marginLeft: '5px', display: 'inline-block' }} />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <EditStakeModal
        isOpen={isEditStakeModalOpen}
        onClose={() => setIsEditStakeModalOpen(false)}
      />
      <style>{`
        .red-gradient-btn {
          background: linear-gradient(-180deg, rgb(247, 36, 36), rgb(187, 28, 0)) !important;
          color: #fff !important;
          padding: 0 10px !important;
          
        }
        .red-gradient-btn:hover {
          opacity: 0.9;
          color: #fff !important;
        }
        .login-wrap {
          display: flex !important;
          align-items: center !important;
          margin: 0 !important;
          padding: 0 !important;
          list-style: none !important;
        }
        .login-wrap li {
          margin: 0 5px 0 0 !important;
          display: flex !important;
          align-items: center !important;
          float: none !important;
          height: 30px !important;
        }
        .login-wrap li.user {
          padding-left: 22px !important;
          position: relative !important;
        }
        .login-wrap input {
          margin: 0 !important;
          vertical-align: middle !important;
          color: #000 !important;
        }
        .btn-login, .btn-signup {
          display: flex !important;
          align-items: center;
          justify-content: center;
          gap: 5px;
          height: 25px !important;
          line-height: 25px !important;
          padding: 0 8px !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          text-decoration: none !important;
          margin: 0 !important;
        }
        .icon-login {
          width: 10px !important;
          height: 11px !important;
          display: inline-block !important;
          background: url('data:image/svg+xml,<svg width="10" height="11" xmlns="http://www.w3.org/2000/svg"><path d="M5.71 7.706l1.432-1.604H1.778V4.898h5.39L5.71 3.294l.781-.86L9.278 5.5 6.49 8.565l-.78-.86zM1.12 0C.825 0 .564.124.339.372a1.24 1.24 0 0 0-.339.86v8.536c0 .325.113.611.339.86.225.248.486.372.78.372H8.88c.295 0 .556-.124.781-.372a1.24 1.24 0 0 0 .339-.86V7.333H8.88v2.435H1.12V1.232h7.76v2.435H10V1.232a1.24 1.24 0 0 0-.339-.86C9.436.124 9.175 0 8.881 0H1.12z" fill="%23FFF" fill-rule="evenodd"/></svg>') no-repeat !important;
          margin: 0 !important;
          position: static !important;
        }
      `}</style>
    </>
  );
}

export default DesktopHeader;

