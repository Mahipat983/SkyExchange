import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import AccountLayout from './AccountLayout';
import { useAuthStore } from '../../store/authStore';
import { bettingController } from '../../controllers';
import { formatTime12h } from '../../utils/format';

function BetsHistoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Current Bets');
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Profit & Loss / History States
  const [plData, setPlData] = useState([]);
  const [plLoading, setPlLoading] = useState(false);
  const [collapsedItems, setCollapsedItems] = useState({});

  // Bet Detail Modal State
  const [selectedEid, setSelectedEid] = useState(null);
  const [betDetailData, setBetDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Default dates
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const formatDateForInput = (date) => date.toISOString().split('T')[0];
  const formatDateForApi = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  };

  const [plStartDate, setPlStartDate] = useState(formatDateForInput(lastWeek));
  const [plEndDate, setPlEndDate] = useState(formatDateForInput(today));

  const location = useLocation();
  const { loginToken, isLoggedIn, username } = useAuthStore();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');

    if (tabParam === 'history') {
      setActiveTab('Bets History');
    } else if (tabParam === 'pnl') {
      setActiveTab('Profit & Loss');
    } else {
      setActiveTab('Current Bets');
    }
  }, [location.search]);

  useEffect(() => {
    if (isLoggedIn && loginToken) {
      if (activeTab === 'Current Bets') {
        fetchCurrentBets();
      } else {
        fetchHistoryAndPL();
      }
    }
  }, [isLoggedIn, loginToken, activeTab, plStartDate, plEndDate]);

  const fetchCurrentBets = async () => {
    try {
      setLoading(true);
      const res = await bettingController.getMyBets(loginToken);
      if (res && typeof res === 'object' && !res.error) {
        const betArray = Object.values(res).filter(item => typeof item === 'object' && item !== null && (item.Game || item.Selection || item.gid));
        setBets(betArray);
      } else {
        setBets([]);
      }
    } catch (err) {
      console.error('Failed to fetch current bets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryAndPL = async () => {
    try {
      setPlLoading(true);
      const res = await bettingController.getProfitLoss(
        loginToken,
        formatDateForApi(plStartDate),
        formatDateForApi(plEndDate)
      );
      if (res && typeof res === 'object' && !res.error) {
        const plArray = Object.values(res).filter(item => typeof item === 'object' && item !== null && item.DateTime);
        setPlData(plArray);
      } else {
        setPlData([]);
      }
    } catch (err) {
      console.error('Failed to fetch P&L/History:', err);
    } finally {
      setPlLoading(false);
    }
  };

  const fetchBetDetails = async (eid) => {
    try {
      setSelectedEid(eid);
      setDetailLoading(true);
      setBetDetailData(null);
      const res = await bettingController.getBetStatement(eid, loginToken);
      if (res && !res.error) {
        setBetDetailData(res);
      } else {
        setBetDetailData({ error: '1', msg: res?.msg || 'Details not available' });
      }
    } catch (err) {
      console.error('Failed to fetch bet details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleCollapse = (idx) => {
    setCollapsedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const currentBetsToday = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    return bets;
  }, [bets]);

  const totalPL = useMemo(() => {
    return plData.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  }, [plData]);

  const renderTableHeaders = (type) => (
    <tr style={{ background: '#3b5160', color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
      <th style={{ padding: '12px', textAlign: 'left' }}>Market / Event</th>
      <th style={{ padding: '12px', textAlign: 'center' }}>Selection</th>
      <th style={{ padding: '12px', textAlign: 'center' }}>Type</th>
      <th style={{ padding: '12px', textAlign: 'center' }}>Rate</th>
      <th style={{ padding: '12px', textAlign: 'center' }}>Stake</th>
      <th style={{ padding: '12px', textAlign: 'right' }}>Date</th>
    </tr>
  );

  const renderCurrentBets = () => (
    <div className="bets-container">
      <div className="data-table-wrapper" style={{ border: '1px solid #7e97a7', borderRadius: '4px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>{renderTableHeaders('current')}</thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#666', background: '#f4f7f9' }}>Loading open bets...</td></tr>
            ) : currentBetsToday.length > 0 ? (
              currentBetsToday.map((bet, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee', fontSize: '13px' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#3b5160' }}>
                    {bet.gid ? (
                      <Link
                        to={`/event-detail/${bet.gid}`}
                        style={{ color: '#3b5160', textDecoration: 'none', cursor: 'pointer' }}
                        onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                      >
                        {bet.Game || bet.Market || '-'}
                      </Link>
                    ) : (
                      bet.Game || bet.Market || '-'
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{bet.Selection || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      background: (bet.Side || '').toLowerCase() === 'back' ? '#a5d8ff' : '#f8b9c6',
                      color: (bet.Side || '').toLowerCase() === 'back' ? '#007bff' : '#dc3545'
                    }}>
                      {(bet.Side || 'BACK').toUpperCase()}
                    </span>
                    <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>{bet.Game_Type || bet.Type}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: '900', color: '#ffb400' }}>{bet.Rate}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>₹{parseFloat(bet.Stake).toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '11px' }}>{formatTime12h(bet.Date || bet.datetime)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#666', background: '#f4f7f9' }}>No open bets for today.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBetsHistory = () => (
    <div className="bets-container">
      <div className="bets-history-filter" style={{
        display: 'flex',
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: '15px',
        marginBottom: '20px',
        alignItems: 'stretch',
        background: '#e4e4e4',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #7e97a7'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: '1 1 auto' }}>
          {/* <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Period:</span> */}
          <input type="date" value={plStartDate} onChange={e => setPlStartDate(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', flex: '1 1 120px' }} />
          <span style={{ color: '#666' }}>to</span>
          <input type="date" value={plEndDate} onChange={e => setPlEndDate(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', flex: '1 1 120px' }} />
        </div>
        <button
          className="get-history-btn"
          onClick={fetchHistoryAndPL}
          style={{
            background: '#3b5160',
            border: 'none',
            color: '#fff',
            padding: '10px 25px',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase',
            width: window.innerWidth <= 768 ? '100%' : 'auto'
          }}
        >
          Get History
        </button>
      </div>

      <div className="data-table-wrapper" style={{ border: '1px solid #7e97a7', borderRadius: '4px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', minWidth: '400px' }}>
          <thead>
            <tr style={{ background: '#3b5160', color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Market / Event</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {plLoading ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#666', background: '#f4f7f9' }}>Fetching history...</td></tr>
            ) : plData.length > 0 ? (
              plData.map((row, i) => {
                const amt = parseFloat(row.amount);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #eee', fontSize: '13px' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#3b5160' }}>{row.GameName}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '11px' }}>{formatTime12h(row.DateTime)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '900', color: amt >= 0 ? '#508d0e' : '#c0392b' }}>
                      {amt >= 0 ? '+' : ''}{amt.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#666', background: '#f4f7f9' }}>No history found for this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfitAndLoss = () => (
    <div className="pnl-container">
      <div className="pnl-filter-bar" style={{
        display: 'flex',
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
        gap: '15px',
        marginBottom: '25px',
        alignItems: 'stretch',
        background: '#fff',
        border: '1px solid #7e97a7',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <div className="pnl-date-inputs" style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1' }}>
            <span style={{ fontSize: '9px', color: '#7e97a7', fontWeight: 'bold', textTransform: 'uppercase' }}>Start</span>
            <input type="date" value={plStartDate} onChange={e => setPlStartDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1' }}>
            <span style={{ fontSize: '9px', color: '#7e97a7', fontWeight: 'bold', textTransform: 'uppercase' }}>End</span>
            <input type="date" value={plEndDate} onChange={e => setPlEndDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', width: '100%' }} />
          </div>
        </div>
        <div className="pnl-net-section" style={{
          textAlign: window.innerWidth <= 768 ? 'center' : 'right',
          padding: '10px',
          borderLeft: window.innerWidth <= 768 ? 'none' : '1px solid #eee',
          borderTop: window.innerWidth <= 768 ? '1px solid #eee' : 'none',
          minWidth: '150px'
        }}>
          <span style={{ display: 'block', fontSize: '10px', color: '#7e97a7', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>Net Profit/Loss</span>
          <span style={{ fontSize: '20px', fontWeight: '900', color: totalPL >= 0 ? '#508d0e' : '#c0392b' }}>PTH {totalPL.toLocaleString()}</span>
        </div>
        <button
          className="pnl-apply-btn"
          onClick={fetchHistoryAndPL}
          style={{
            background: '#3b5160',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase',
            width: '100%'
          }}
        >
          Apply Filter
        </button>
      </div>

      <div className="pnl-cards" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {plLoading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid #ffb400', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}></div>
          </div>
        ) : plData.length > 0 ? (
          plData.map((item, idx) => {
            const amount = parseFloat(item.amount || 0);
            const isPositive = amount >= 0;
            const isCollapsed = collapsedItems[idx];
            return (
              <div key={idx} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #7e97a7', overflow: 'hidden', transition: 'transform 0.2s' }}>
                <div
                  onClick={() => toggleCollapse(idx)}
                  style={{ background: isCollapsed ? '#f8f9fa' : '#f4f7f9', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: isCollapsed ? 'none' : '1px solid #eee' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: isPositive ? '#508d0e' : '#c0392b', color: '#fff', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      {isPositive ? '✓' : '✗'}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#3b5160' }}>{item.GameName}</h4>
                      <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{formatTime12h(item.DateTime)}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '10px', color: '#7e97a7', fontWeight: 'bold', textTransform: 'uppercase' }}>Net Change</p>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: isPositive ? '#508d0e' : '#c0392b' }}>
                        {isPositive ? '+' : ''}{amount.toLocaleString()}
                      </p>
                    </div>
                    <span style={{ color: '#3b5160', fontSize: '12px' }}>{isCollapsed ? '▼' : '▲'}</span>
                  </div>
                </div>
                {!isCollapsed && (
                  <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>Activity Segment: <strong style={{ color: '#3b5160' }}>{item.Type || 'Market Betting'}</strong></span>
                      {item.Eid && (
                        <button
                          onClick={() => fetchBetDetails(item.Eid)}
                          style={{ background: '#ffb400', border: 'none', color: '#000', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', padding: '6px 15px', borderRadius: '4px', textTransform: 'uppercase' }}
                        >
                          View Statement →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', background: '#f4f7f9', borderRadius: '8px', border: '1px solid #7e97a7', color: '#7e97a7', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            No transaction records found for the selected dates.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AccountLayout title={activeTab}>
      <div className="tabs-header" style={{ display: 'flex', gap: '2px', marginBottom: '25px', background: '#3b5160', padding: '4px', borderRadius: '6px' }}>
        {['Current Bets', 'Bets History', 'Profit & Loss'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              const param = tab === 'Bets History' ? 'history' : tab === 'Profit & Loss' ? 'pnl' : 'current';
              window.history.pushState({}, '', `?tab=${param}`);
              setActiveTab(tab);
            }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all',
              background: activeTab === tab ? '#ffb400' : 'transparent',
              color: activeTab === tab ? '#000' : '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'Current Bets' && renderCurrentBets()}
        {activeTab === 'Bets History' && renderBetsHistory()}
        {activeTab === 'Profit & Loss' && renderProfitAndLoss()}
      </div>

      {selectedEid && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }} onClick={() => setSelectedEid(null)}></div>
          <div style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #7e97a7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#3b5160' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>Statement Detail</h3>
              <button onClick={() => setSelectedEid(null)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#fff', lineHeight: '1' }}>×</button>
            </div>
            <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto', background: '#f4f7f9' }}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid #ffb400', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}></div></div>
              ) : betDetailData?.error === '1' ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#c0392b', fontWeight: 'bold' }}>{betDetailData.msg}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {Object.values(betDetailData || {}).filter(b => typeof b === 'object' && b !== null).map((bet, idx) => (
                    <div key={idx} style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #7e97a7' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: (bet.Type || '').toLowerCase() === 'back' ? '#007bff' : '#dc3545', textTransform: 'uppercase' }}>{bet.Type}</span>
                        <span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>{formatTime12h(bet.Date)}</span>
                      </div>
                      <p style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold', color: '#3b5160' }}>{bet.Game?.replace(/&nbsp;/g, ' ')}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '9px', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase' }}>Selection</p>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#333' }}>{bet.Selection}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: '9px', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase' }}>Stake</p>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#333' }}>₹{parseFloat(bet.Stake).toLocaleString()}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '9px', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase' }}>Rate</p>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#ffb400' }}>{bet.Rate}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '15px 20px', borderTop: '1px solid #eee', textAlign: 'right', background: '#fff' }}>
              <button onClick={() => setSelectedEid(null)} style={{ background: '#3b5160', color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AccountLayout>
  );
}

export default BetsHistoryPage;
