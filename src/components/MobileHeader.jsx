import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useBettingStore } from '../store/bettingStore';
import { useSnackbarStore } from '../store/snackbarStore';
import { userController } from '../controllers/user/userController';
import { marketController } from '../controllers';

function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, username, loginToken, logout, balance, exposure } = useAuthStore();
  const { stakes, setStakes } = useBettingStore();
  const { show: showSnackbar } = useSnackbarStore();

  const isSearchOpen = useUIStore(state => state.isSearchOpen);
  const openSearch = useUIStore(state => state.openSearch);
  const closeSearch = useUIStore(state => state.closeSearch);

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);

  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [localStakes, setLocalStakes] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetchingStakes, setIsFetchingStakes] = useState(false);

  const getActive = (href) => {
    const path = location.pathname;
    if (href === '/' && (path === '/' || path === '/index')) return 'active';
    if (href !== '/' && path.startsWith(href)) return 'active';
    return '';
  };

  useEffect(() => {
    if (!showSettings || !loginToken) {
      if (showSettings) setLocalStakes([...stakes]);
      return;
    }

    const fetchStakes = async () => {
      setIsFetchingStakes(true);
      try {
        const response = await userController.getStakeButtons(loginToken);
        if (response && typeof response === 'object' && !response.error) {
          const fetchedStakes = [];
          for (let i = 1; i <= 6; i++) {
            const item = response[i.toString()] || response[i];
            if (item) {
              fetchedStakes.push({
                label: item.Btnname || item.btnname || `S${i}`,
                value: item.Btnval || item.btnval || '0'
              });
            }
          }
          if (fetchedStakes.length > 0) {
            setLocalStakes(fetchedStakes);
            setStakes(fetchedStakes);
          } else {
            setLocalStakes([...stakes]);
          }
        } else {
          setLocalStakes([...stakes]);
        }
      } catch (err) {
        setLocalStakes([...stakes]);
      } finally {
        setIsFetchingStakes(false);
      }
    };

    fetchStakes();
  }, [showSettings, loginToken]);

  const handleStakeChange = (index, field, value) => {
    const updated = [...localStakes];
    updated[index] = { ...updated[index], [field]: value };
    setLocalStakes(updated);
  };

  const handleUpdateStakes = async () => {
    setIsUpdating(true);
    try {
      const payload = {};
      localStakes.forEach((s, i) => {
        payload[`Label${i + 1}`] = s.label || `S${i + 1}`;
        payload[`Stake${i + 1}`] = s.value;
      });

      if (loginToken) {
        const res = await userController.editStake(loginToken, payload);
        if (res && (res.status === 'Success' || res.error === '0')) {
          setStakes(localStakes);
          showSnackbar('Stake values updated successfully!', 'success');
          setShowSettings(false);
        } else {
          showSnackbar(res?.msg || 'Failed to update stake values', 'error');
        }
      } else {
        setStakes(localStakes);
        setShowSettings(false);
      }
    } catch (err) {
      showSnackbar('Error updating stake values', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (!searchInput || searchInput.length < 3) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const token = useAuthStore.getState().getToken() || '';
        const res = await marketController.search(token, searchInput);
        setSearchResults(Array.isArray(res) ? res : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        closeSearch();
        setSearchInput('');
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isSearchOpen]);

  const accountMenuItems = [
    { label: 'My Profile', to: '/profile', icon: '👤' },
    { label: 'Balance Overview', to: '/balance-overview', icon: '👛' },
    { label: 'Account Statement', to: '/statement', icon: '📄' },
    { label: 'My Bets', to: '/bets?tab=current', icon: '🎯' },
    { label: 'Bets History', to: '/bets?tab=history', icon: '📋' },
    { label: 'Profit & Loss', to: '/bets?tab=pnl', icon: '📊' },
    { label: 'Offers', to: '/offers', icon: '🎁' },
    { label: 'Setting', to: null, icon: '⚙️', isAction: true },
  ];

  return (
    <>
      <style>{`
        /* === SEARCH POPUP === */
        .mhdr-search-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 2000;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
        .mhdr-search-box {
          background: #1a2a35;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #2e4b5e;
        }
        .mhdr-search-box input {
          flex: 1;
          background: #fff;
          border: none !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          font-size: 14px !important;
          color: #333 !important;
          height: 38px !important;
          outline: none !important;
          box-shadow: none !important;
          margin: 0 !important;
        }
        .mhdr-search-close {
          background: none;
          border: none;
          color: #fff;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
        }
        .mhdr-search-results {
          background: #fff;
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .mhdr-search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          border-bottom: 1px solid #f0f0f0;
          text-decoration: none;
          color: #333;
        }
        .mhdr-search-result-item:active { background: #f5f5f5; }
        .mhdr-search-hint {
          padding: 20px;
          text-align: center;
          color: #999;
          font-size: 13px;
        }

        /* === FULL SCREEN SETTINGS OVERLAY === */
        .mhdr-settings-overlay {
          position: fixed;
          inset: 0;
          background: #f4f4f4;
          z-index: 6000;
          display: flex;
          flex-direction: column;
          animation: slideInUp 0.3s ease;
        }
        @keyframes slideInUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .mhdr-settings-header {
          background: #1a2a35;
          padding: 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #fff;
        }
        .mhdr-settings-header h2 { margin: 0; font-size: 18px; font-weight: bold; }
        .mhdr-settings-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }
        .mhdr-stake-section {
          background: #fff;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .mhdr-stake-grid-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 10px;
          font-weight: bold;
          font-size: 13px;
          color: #666;
        }
        .mhdr-stake-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 12px;
        }
        .mhdr-stake-row input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          outline: none;
        }
        .mhdr-stake-row input:focus { border-color: #ffb400; }
        .mhdr-update-btn {
          width: 100%;
          padding: 14px;
          background: #ffb400;
          color: #1a2a35;
          border: none;
          border-radius: 6px;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          margin-top: 10px;
        }

        /* === SIDEBAR === */
        .mhdr-sidebar-overlay {
          position: fixed;
          inset: 0;
          z-index: 3000;
          display: flex;
          justify-content: flex-end;
        }
        .mhdr-sidebar-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
        }
        .mhdr-sidebar {
          position: relative;
          width: 280px;
          max-width: 80vw;
          background: #1a2a35;
          height: 100%;
          display: flex;
          flex-direction: column;
          z-index: 1;
          animation: slideInRight 0.25s ease;
          overflow-y: auto;
        }
        .mhdr-sidebar-header {
          background: linear-gradient(180deg, #2e4b5e 0%, #1a2a35 100%);
          padding: 20px 16px 16px;
          border-bottom: 1px solid #2e4b5e;
        }
        .mhdr-sidebar-username {
          font-size: 16px;
          font-weight: bold;
          color: #ffb400;
          margin-bottom: 4px;
        }
        .mhdr-sidebar-balance {
          font-size: 12px;
          color: #aaa;
        }
        .mhdr-sidebar-balance strong {
          color: #fff;
        }
        .mhdr-sidebar-menu {
          list-style: none;
          padding: 8px 0;
          margin: 0;
          flex: 1;
        }
        .mhdr-sidebar-menu li a,
        .mhdr-sidebar-menu li button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          color: #e0e0e0;
          text-decoration: none;
          font-size: 14px;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.15s;
        }
        .mhdr-sidebar-menu li a:active,
        .mhdr-sidebar-menu li button:active {
          background: rgba(255,255,255,0.08);
        }
        .mhdr-sidebar-menu li .menu-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
        }
        .mhdr-sidebar-deposit-row {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .mhdr-sidebar-deposit-btn {
          flex: 1;
          padding: 10px 0;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          text-align: center;
          text-decoration: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        .mhdr-sidebar-logout-btn {
          margin: 0 16px 16px;
          padding: 12px;
          background: linear-gradient(180deg, #e93522 0%, #be2414 100%);
          border: 1px solid #8a0011;
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
          font-weight: bold;
          width: calc(100% - 32px);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* === HEADER ICON BUTTONS — themed, round, small === */
        .mhdr-icon-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%);
          border: 1px solid rgba(255, 180, 0, 0.35);
          cursor: pointer;
          color: #ffb400;
          text-decoration: none;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
          transition: background 0.15s, box-shadow 0.15s;
        }
        .mhdr-icon-btn:active {
          background: linear-gradient(180deg, #222 0%, #111 100%);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.6);
        }
        .mhdr-bets-header-btn {
          background: #ffb400;
          color: #1a2a35;
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 12px;
          text-decoration: none;
           
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          flex-shrink: 0;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mhdr-bets-header-btn:active {
          transform: translateY(1px);
          box-shadow: none;
        }
        .mhdr-logged-in-row {
          display: flex;
          align-items: center;
          gap: 7px;
          position: relative;
        }
      `}</style>

      {/* Mobile Header */}
      <header>
        <h1 className="top-logo"></h1>

        {!isLoggedIn ? (
          /* ===== LOGGED OUT: Sign up / Login ===== */
          <div className="btn-wrap">
            <Link className="btn-signup ui-link" to="/signup">Sign up</Link>
            <Link className="login-index ui-link" to="/login">Login</Link>
            <button className="login-index ui-link" style={{ background: 'linear-gradient(180deg, #555, #333)', marginLeft: '5px' }}>Demo</button>
          </div>
        ) : (
          /* ===== LOGGED IN: Bets | Search | Wallet | Setting | User ===== */
          <div className="mhdr-logged-in-row">
            {/* 1. Deposit shortcut */}
            <Link
              className="mhdr-shortcut-btn"
              to="/wallet/deposit"
              style={{
                background: '#28a745',
                color: '#fff',
                border: '2px solid #fff',
                borderRadius: '6px',
                width: '25px',
                height: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '12px',
                textDecoration: 'none'
              }}
            >
              D
            </Link>

            {/* 2. Withdraw shortcut */}
            <Link
              className="mhdr-shortcut-btn"
              to="/wallet/withdrawal"
              style={{
                background: '#dc3545',
                color: '#fff',
                border: '2px solid #fff',
                borderRadius: '6px',
                width: '25px',
                height: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '12px',
                textDecoration: 'none'
              }}
            >
              W
            </Link>

            {/* 3. Bets button */}
            <Link className="mhdr-bets-header-btn" to="/bets" style={{ padding: '4px 8px', height: "25px", fontSize: '11px', minWidth: 'unset' }}>
              Bets
            </Link>

            {/* 4. Balance & Exposure Box */}
            <Link
              to="/balance-overview"
              style={{
                background: '#333',
                borderRadius: '6px',
                height: "35px",
                padding: '2px 8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textDecoration: 'none',
                minWidth: '70px',
                border: '1px solid #444',
                lineHeight: '1.2'
              }}
            >
              <div style={{ color: '#ffb400', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                Bal: <span style={{ color: '#ffb400' }}>₹{balance}</span>
              </div>
              <div style={{ color: '#ffb400', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                Exp: <span style={{ color: '#ffb400' }}>₹{exposure || '0.00'}</span>
              </div>
            </Link>

            {/* 5. Search icon (replaces Setting) */}
            <button
              className="mhdr-icon-btn"
              onClick={openSearch}
              aria-label="Search"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* 6. User icon → Sidebar */}
            <button
              className="mhdr-icon-btn"
              onClick={() => setShowSidebar(true)}
              aria-label="Account"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </button>
          </div>
        )}
      </header>

      {/* ===== FULL SCREEN SETTINGS OVERLAY ===== */}
      {showSettings && (
        <div className="mhdr-settings-overlay">
          <div className="mhdr-settings-header">
            <h2>Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px' }}
            >
              ✕
            </button>
          </div>

          <div className="mhdr-settings-content">
            <div className="mhdr-stake-section">
              <h3 style={{ margin: '0 0 15px', fontSize: '15px', color: '#fff', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Edit Stake Buttons</h3>

              <div className="mhdr-stake-grid-header">
                <span>Label</span>
                <span>Value</span>
              </div>

              {isFetchingStakes ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading stakes...</div>
              ) : (
                <>
                  {localStakes.map((s, idx) => (
                    <div key={idx} className="mhdr-stake-row">
                      <input
                        type="text"
                        value={s.label}
                        onChange={(e) => handleStakeChange(idx, 'label', e.target.value)}
                        placeholder={`S${idx + 1}`}
                      />
                      <input
                        type="number"
                        value={s.value}
                        onChange={(e) => handleStakeChange(idx, 'value', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}

                  <button
                    className="mhdr-update-btn"
                    onClick={handleUpdateStakes}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'UPDATING...' : 'UPDATE STAKES'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== SEARCH POPUP ===== */}
      {isSearchOpen && (
        <div className="mhdr-search-overlay">
          <div className="mhdr-search-box" ref={searchRef}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Search events..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              className="mhdr-search-close"
              onClick={() => { closeSearch(); setSearchInput(''); setSearchResults([]); }}
            >
              ✕
            </button>
          </div>
          <div className="mhdr-search-results">
            {searchInput.length === 0 && (
              <p className="mhdr-search-hint">Type to search for events...</p>
            )}
            {searchInput.length > 0 && searchInput.length < 3 && (
              <p className="mhdr-search-hint">Enter at least 3 characters</p>
            )}
            {searchLoading && (
              <p className="mhdr-search-hint">Searching...</p>
            )}
            {!searchLoading && searchInput.length >= 3 && searchResults.length === 0 && (
              <p className="mhdr-search-hint">No events found for "{searchInput}"</p>
            )}
            {!searchLoading && searchResults.map((res, i) => {
              const time = res.Datetime ? res.Datetime.split(' ')[1]?.substring(0, 5) : '--:--';
              return (
                <Link
                  key={res.Gid || i}
                  className="mhdr-search-result-item"
                  to={`/${(res.Type || 'cricket').toLowerCase()}/${res.Gid}`}
                  onClick={() => { closeSearch(); setSearchInput(''); setSearchResults([]); }}
                >
                  <span style={{ fontSize: 12, color: '#999', minWidth: 40 }}>{time}</span>
                  <span style={{ fontSize: 14, fontWeight: 'bold' }}>{res.GameName}</span>
                  <span style={{ fontSize: 11, color: '#aaa', marginLeft: 'auto' }}>{res.Type}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== SIDEBAR ===== */}
      {showSidebar && (
        <div className="mhdr-sidebar-overlay">
          <div className="mhdr-sidebar-backdrop" onClick={() => setShowSidebar(false)} />
          <div className="mhdr-sidebar">
            <div className="mhdr-sidebar-header">
              <div className="mhdr-sidebar-username">{username}</div>
              <div className="mhdr-sidebar-balance">
                Balance: <strong>₹{balance}</strong>
                &nbsp;&nbsp;Exposure: <strong>₹{exposure}</strong>
              </div>
            </div>
            <div className="mhdr-sidebar-deposit-row">
              <Link
                className="mhdr-sidebar-deposit-btn"
                to="/wallet/deposit"
                style={{ background: 'linear-gradient(180deg,#2a9a00,#1a6800)' }}
                onClick={() => setShowSidebar(false)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
                DEPOSIT
              </Link>
              <Link
                className="mhdr-sidebar-deposit-btn"
                to="/wallet/withdrawal"
                style={{ background: 'linear-gradient(180deg,#c80000,#8a0000)' }}
                onClick={() => setShowSidebar(false)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
                WITHDRAW
              </Link>
            </div>
            <ul className="mhdr-sidebar-menu">
              {accountMenuItems.map((item) => (
                <li key={item.label}>
                  {item.isAction ? (
                    <button 
                      onClick={() => {
                        if (item.label === 'Setting') setShowSettings(true);
                        setShowSidebar(false);
                      }}
                      style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '13px 16px', color: '#e0e0e0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                      <span className="menu-icon">{item.icon}</span>
                      {item.label}
                    </button>
                  ) : (
                    <Link to={item.to} onClick={() => setShowSidebar(false)}>
                      <span className="menu-icon">{item.icon}</span>
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <button
              className="mhdr-sidebar-logout-btn"
              onClick={() => { logout(); setShowSidebar(false); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              LOGOUT
            </button>
          </div>
        </div>
      )}

      <div className="mobile-bottom-nav">
        <Link to="/sports" className={`mobile-bottom-nav-item ${getActive('/sports')}`}>
          <img className="icon-sports" src="/images/transparent.gif" alt="sports" width="24px" height="24px" />
          <span>Sports</span>
        </Link>
        <Link to="/in-play" className={`mobile-bottom-nav-item ${getActive('/in-play')}`}>
          <img className="icon-inplay" src="/images/transparent.gif" alt="in-play" width="24px" height="24px" />
          <span>In-Play</span>
        </Link>
        <Link to="/" className={`mobile-bottom-nav-item ${getActive('/')}`}>
          <img className="icon-home" src="/images/transparent.gif" alt="Home" width="24px" height="24px" />
          <span>Home</span>
        </Link>
        <Link to={isLoggedIn ? "/multi-markets" : "/login"} className={`mobile-bottom-nav-item ${getActive('/multi-markets')}`}>
          <img className="icon-multi-markets" src="/images/transparent (3).gif" alt="multi-markets" width="24px" height="24px" />
          <span>Multi...</span>
        </Link>
        {isLoggedIn ? (
          <div className="mobile-bottom-nav-item" onClick={() => logout()} style={{ cursor: 'pointer' }}>
            <img className="icon-account" src="/images/transparent.gif" alt="account" width="24px" height="24px" />
            <span>Logout</span>
          </div>
        ) : (
          <Link to="/login" className="mobile-bottom-nav-item">
            <img className="icon-account" src="/images/transparent.gif" alt="account" width="24px" height="24px" />
            <span>Account</span>
          </Link>
        )}
      </div>
    </>
  );
}

export default MobileHeader;
