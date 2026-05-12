import React, { useState, useEffect } from 'react';
import AccountLayout from './AccountLayout';
import { useAuthStore } from '../../store/authStore';
import { statementController } from '../../controllers';

function AccountStatementPage() {
  const { loginToken, isLoggedIn } = useAuthStore();
  const [statementData, setStatementData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedBet, setSelectedBet] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [betLoading, setBetLoading] = useState(false);

  // Default dates: last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateForApi = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  };

  const [startDate, setStartDate] = useState(formatDateForInput(sevenDaysAgo));
  const [endDate, setEndDate] = useState(formatDateForInput(today));

  const fetchStatement = async () => {
    if (!isLoggedIn || !loginToken) return;
    try {
      setLoading(true);
      const res = await statementController.getAccountStatement(
        loginToken,
        formatDateForApi(startDate),
        formatDateForApi(endDate)
      );

      if (res && typeof res === 'object' && !res.error) {
        const dataArray = Object.values(res).filter(item => typeof item === 'object' && item !== null);
        setStatementData(dataArray);
      } else {
        setStatementData([]);
      }
    } catch (err) {
      console.error('Failed to fetch statement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionClick = async (row) => {
    const gid = row["4"];
    if (!gid) return;

    setBetLoading(true);
    setIsModalOpen(true);
    setSelectedBet(null);

    try {
      const res = await statementController.getBetStatement(gid, loginToken);
      // Success if it's an object with at least one key (usually "0", "1", etc.) and no error field
      if (res && typeof res === 'object' && !res.error) {
        setSelectedBet(res);
      } else if (res && res.error === "0") {
        setSelectedBet(res);
      } else {
        setSelectedBet({ error: "1", msg: res?.msg || "No details found" });
      }
    } catch (err) {
      console.error('Failed to fetch bet statement:', err);
    } finally {
      setBetLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [isLoggedIn, loginToken]);

  const filteredData = statementData.filter(row => {
    if (activeFilter === 'All') return true;
    const type = (row["2"] || '').toUpperCase();
    const remark = (row["3"] || '').toLowerCase();

    const isDepositDescr = remark.includes('deposit') || remark.includes('topup');
    const isWithdrawDescr = remark.includes('withdraw') || remark.includes('payout');

    if (activeFilter === 'Deposit') {
      return type === 'D' || (type === 'CR' && isDepositDescr);
    }
    if (activeFilter === 'Withdraw') {
      return type === 'W' || (type === 'DR' && isWithdrawDescr);
    }
    if (activeFilter === 'Win') {
      return type === 'CR' && !isDepositDescr;
    }
    if (activeFilter === 'Loss') {
      return type === 'DR' && !isWithdrawDescr;
    }
    return true;
  });

  const getTxTypeLabel = (type, remark) => {
    const desc = (remark || '').toLowerCase();
    const isDeposit = type === 'D' || (type === 'CR' && (desc.includes('deposit') || desc.includes('topup')));
    const isWithdraw = type === 'W' || (type === 'DR' && (desc.includes('withdraw') || desc.includes('payout')));

    if (isDeposit) return { label: 'Deposit', class: 'tx-type-cr' };
    if (isWithdraw) return { label: 'Withdraw', class: 'tx-type-dr' };
    if (type === 'CR') return { label: 'Win', class: 'tx-type-cr' };
    if (type === 'DR') return { label: 'Loss', class: 'tx-type-dr' };
    if (type === 'O') return { label: 'Opening', class: 'tx-type-o' };
    return { label: type, class: '' };
  };

  return (
    <AccountLayout title="Account Statement">
      <div className="filters-row" style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-end', flexWrap: 'wrap', background: '#fcfcfc', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
        <div className="filter-group">
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#999', marginBottom: '6px' }}>From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="filter-input"
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }}
          />
        </div>
        <div className="filter-group">
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#999', marginBottom: '6px' }}>To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="filter-input"
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }}
          />
        </div>
        <div className="filter-group">
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#999', marginBottom: '6px' }}>Type</label>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            style={{
              padding: '0 12px',
              height: '38px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              background: '#fff',
              cursor: 'pointer',
              minWidth: '120px',
              color: '#333',
              lineHeight: '38px'
            }}
          >
            <option value="All">All</option>
            <option value="Deposit">Deposit</option>
            <option value="Withdraw">Withdraw</option>
            <option value="Win">Win</option>
            <option value="Loss">Loss</option>
          </select>
        </div>
        <button
          onClick={fetchStatement}
          className="btn-search"
          style={{
            padding: '9px 25px',
            background: '#ffb400',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '900',
            textTransform: 'uppercase',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.filter = 'brightness(1.1)'}
          onMouseLeave={(e) => e.target.style.filter = 'brightness(1)'}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="data-table-wrapper" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
        <table className="data-table balance-table" style={{ border: 'none' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ textAlign: 'left', padding: '15px' }}>Date/Time</th>
              <th style={{ textAlign: 'center' }}>Type</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center' }}>Balance</th>
              <th style={{ textAlign: 'left' }}>Remark</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, idx) => {
                const date = row["0"];
                const amount = parseFloat(row["1"]);
                const type = row["2"];
                const remark = row["3"];
                const gid = row["4"];
                const txInfo = getTxTypeLabel(type, remark);

                return (
                  <tr
                    key={idx}
                    onClick={() => handleTransactionClick(row)}
                    style={{ cursor: gid ? 'pointer' : 'default', transition: 'background 0.2s' }}
                    className={gid ? 'hover-row' : ''}
                  >
                    <td style={{ textAlign: 'left', padding: '10px 15px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1a2d3b', whiteSpace: 'nowrap' }}>
                        {row["0"]?.split(' ')[0]}
                      </div>
                      <div style={{ fontSize: '11px', color: '#000', fontWeight: '600', marginTop: '2px', whiteSpace: 'nowrap' }}>
                        {(() => {
                          const timeStr = row["0"]?.split(' ')[1];
                          if (!timeStr) return '';
                          let [h, m, s] = timeStr.split(':');
                          h = parseInt(h);
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          h = h % 12 || 12;
                          return `${h}:${m} ${ampm}`;
                        })()}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`tx-type-badge ${txInfo.class}`}>{txInfo.label}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', whiteSpace: 'nowrap', color: (type === 'CR' || type === 'O' || type === 'D') ? '#2ecc71' : '#e74c3c' }}>
                      {(type === 'CR' || type === 'O' || type === 'D') ? '+' : '-'}₹{Math.abs(amount).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#666', whiteSpace: 'nowrap' }}>
                      {type === 'O' ? amount.toLocaleString() : '-'}
                    </td>
                    <td style={{ textAlign: 'left', fontSize: '12px', color: '#555' }} dangerouslySetInnerHTML={{ __html: remark }}></td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  {loading ? 'Fetching transactions...' : 'No transactions found for this period.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bet Statement Modal */}
      {isModalOpen && (
        <div className="bet-detail-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="bet-detail-modal-content animate-popup" onClick={e => e.stopPropagation()}>
            <div className="bet-detail-header">
              <h3>Bet Detail Receipt</h3>
              <button className="bet-detail-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="bet-detail-body">
              {betLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="ios-spinner">
                    <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
                  </div>
                  <p style={{ marginTop: '15px', fontSize: '12px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Fetching Bet Receipt...</p>
                </div>
              ) : selectedBet?.error === "1" ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c', fontWeight: 'bold' }}>
                  {selectedBet.msg}
                </div>
              ) : (
                <div className="bet-receipt-container">
                  {Object.entries(selectedBet || {})
                    .filter(([key]) => !isNaN(Number(key)))
                    .map(([key, bet]) => (
                      <div key={key} className="bet-receipt-item">
                        <div className="bet-receipt-row" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '900', color: '#1a2d3b' }}>{bet.Game?.replace(/&nbsp;/g, ' ')}</span>
                          <span className={`tx-type-badge ${bet.Side?.toLowerCase() === 'back' ? 'tx-type-back' : 'tx-type-lay'}`}>
                            {bet.Side}
                          </span>
                        </div>
                        <div className="bet-receipt-row">
                          <span className="bet-receipt-label">Selection</span>
                          <span className="bet-receipt-value" style={{ color: '#ffb400' }}>{bet.Selection}</span>
                        </div>
                        <div className="bet-receipt-row">
                          <span className="bet-receipt-label">Rate</span>
                          <span className="bet-receipt-value">{bet.Rate}</span>
                        </div>
                        <div className="bet-receipt-row">
                          <span className="bet-receipt-label">Stake</span>
                          <span className="bet-receipt-value">₹{parseFloat(bet.Stake).toLocaleString()}</span>
                        </div>
                        <div className="bet-receipt-row">
                          <span className="bet-receipt-label">Date</span>
                          <span className="bet-receipt-value" style={{ fontSize: '11px', color: '#000' }}>{bet.Date}</span>
                        </div>
                      </div>
                    ))}

                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#1a2d3b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '800',
                      marginTop: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    CLOSE RECEIPT
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover-row:hover { background: #fffcf0 !important; }
        .bet-detail-header { background: #1a2d3b; color: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .bet-detail-header h3 { margin: 0; background : transparent; font-size: 16px; font-weight: 800; color: #fff !important; text-transform: uppercase; letter-spacing: 0.5px; }
        .bet-detail-close { background: none; border: none; color: #fff; font-size: 28px; cursor: pointer; line-height: 1; padding: 0; }
        .ios-spinner { display: inline-block; position: relative; width: 40px; height: 40px; }
        .ios-spinner div { transform-origin: 20px 20px; animation: ios-spinner 1.2s linear infinite; }
        .ios-spinner div:after { content: " "; display: block; position: absolute; top: 3px; left: 18px; width: 3px; height: 10px; border-radius: 20%; background: #ffb400; }
        .ios-spinner div:nth-child(1) { transform: rotate(0deg); animation-delay: -1.1s; }
        .ios-spinner div:nth-child(2) { transform: rotate(30deg); animation-delay: -1s; }
        .ios-spinner div:nth-child(3) { transform: rotate(60deg); animation-delay: -0.9s; }
        .ios-spinner div:nth-child(4) { transform: rotate(90deg); animation-delay: -0.8s; }
        .ios-spinner div:nth-child(5) { transform: rotate(120deg); animation-delay: -0.7s; }
        .ios-spinner div:nth-child(6) { transform: rotate(150deg); animation-delay: -0.6s; }
        .ios-spinner div:nth-child(7) { transform: rotate(180deg); animation-delay: -0.5s; }
        .ios-spinner div:nth-child(8) { transform: rotate(210deg); animation-delay: -0.4s; }
        .ios-spinner div:nth-child(9) { transform: rotate(240deg); animation-delay: -0.3s; }
        .ios-spinner div:nth-child(10) { transform: rotate(270deg); animation-delay: -0.2s; }
        .ios-spinner div:nth-child(11) { transform: rotate(300deg); animation-delay: -0.1s; }
        .ios-spinner div:nth-child(12) { transform: rotate(330deg); animation-delay: 0s; }
        @keyframes ios-spinner { 0% { opacity: 1; } 100% { opacity: 0; } }
      `}</style>
    </AccountLayout>
  );
}

export default AccountStatementPage;
