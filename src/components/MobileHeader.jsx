import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { userController } from '../controllers';

function MobileHeader() {
  const location = useLocation();
  const { isLoggedIn, username, loginToken, logout } = useAuthStore();
  const [balanceData, setBalanceData] = useState({ balance: '0', exposure: '0' });

  const getActive = (href) => {
    const path = location.pathname;
    if (href === '/' && (path === '/' || path === '/index')) return 'active';
    if (href !== '/' && path.startsWith(href)) return 'active';
    return '';
  };

  const refreshBalance = async () => {
    const token = useAuthStore.getState().getToken();
    if (!isLoggedIn || !token) return;
    try {
      const response = await userController.getBalance(token);
      if (response.error === '0') {
        setBalanceData({
          balance: response.balance || '0',
          exposure: response.exposure || '0'
        });
      }
    } catch (error) {
      console.error('Mobile Balance refresh error:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      refreshBalance();
      const timer = setInterval(refreshBalance, 30000);
      return () => clearInterval(timer);
    }
  }, [isLoggedIn, loginToken]);

  return (
    <>
      {/* Mobile Header */}
      <header>
        <h1 className="top-logo"></h1>
        {!isLoggedIn ? (
          <div className="btn-wrap">
            <Link className="btn-signup ui-link" to="/signup">Sign up</Link>
            <Link className="login-index ui-link" to="/login">Login</Link>
          </div>
        ) : (
          <div className="account-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/balance-overview" className="account-number">{username}</Link>
              <div className="account-balance">
                  <span id="mainBalance"><span className="badge-currency">USD</span> {balanceData.balance}</span>
              </div>
            </div>
            <div className="mobile-action-buttons" style={{ display: 'flex', gap: '4px' }}>
              <Link 
                to="/wallet/deposit"
                style={{ 
                  background: '#1e8000', 
                  color: '#fff', 
                  border: '1px solid #fff', 
                  borderRadius: '3px', 
                  padding: '2px 6px', 
                  fontSize: '10px', 
                  fontWeight: 'bold', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '3px', 
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  textDecoration: 'none'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h2v2h4v-2c2-1.5 2-2.7 2-4.5 0-5.3-7.5-6.5-11-5" />
                  <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none" />
                </svg>
                DEPOSIT
              </Link>
              <Link 
                to="/wallet/withdrawal"
                style={{ 
                  background: '#b80000', 
                  color: '#fff', 
                  border: '1px solid #fff', 
                  borderRadius: '3px', 
                  padding: '2px 6px', 
                  fontSize: '10px', 
                  fontWeight: 'bold', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '3px', 
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  textDecoration: 'none'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 5l-5 5-3-3-4 4" />
                  <polyline points="13 5 18 5 18 10" />
                  <path d="M2 18h16l2 2H4l-2-2z" />
                </svg>
                WITHDRAWAL
              </Link>
            </div>
          </div>
        )}

        <div id="msgBox" className="message-wrap success to-open_bets" style={{ display: 'none' }}>
          <div className="message">
            <h4 id="header">Bet Matched</h4>
            <p id="info">
              <span id="sideType" className="back">Back</span>
              <strong id="selectionName">England</strong> <strong id="stake">$1,000</strong> at odds <strong id="odds">1.29</strong>
            </p>
          </div>
          <Link id="close" className="close ui-link" to="/">Close</Link>
        </div>

        <div id="multiWalletDiv" className="overlay" style={{ display: 'none' }}>
          <div className="wallet-detail">
            <div className="wallet-detail-group">
              <dl className="wallet-detail-content">
                <dt>Main Balance</dt>
                <dd className="wallet-balance-num">
                  <span className="badge-currency" id="currency">USD</span>
                  <span id="mainBalance">$ 0.00</span>
                </dd>
                <dd className="wallet-exposure">Exposure <span id="mainExposure">$ 0.00</span></dd>
              </dl>
            </div>
            <div id="walletContent" className="wallet-detail-group"></div>
            <div className="btn-box">
              <button className="btn ui-btn ui-shadow ui-corner-all" id="balanceClose">Close</button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <Link to="/casino" className={`mobile-bottom-nav-item ${getActive('/casino')}`}>
          <img className="icon-promote" src="/images/promot.svg" alt="casino" width="24px" height="24px" />
          <span>Casino</span>
        </Link>
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
        <Link to="/multi-markets" className={`mobile-bottom-nav-item ${getActive('/multi-markets')}`}>
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
