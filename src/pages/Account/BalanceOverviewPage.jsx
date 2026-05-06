import React, { useState, useEffect } from 'react';
import AccountLayout from './AccountLayout';
import { userController } from '../../controllers';
import { useAuthStore } from '../../store/authStore';

function BalanceOverviewPage() {
  const { loginToken, isLoggedIn, username, balance, exposure, updateBalance } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!isLoggedIn || !loginToken) return;
    try {
      setLoading(true);
      const res = await userController.getBalance(loginToken);
      if (res && res.error === '0') {
        updateBalance(res.balance, res.exposure);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [isLoggedIn, loginToken]);

  return (
    <AccountLayout title="Balance Overview">
      <div className="balance-overview-container" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
            <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid #ffb400', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
          </div>
        ) : (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="balance-hero" style={{ background: 'linear-gradient(135deg, #3b5160 0%, #243a48 100%)', borderRadius: '8px', padding: '30px', color: '#fff', marginBottom: '30px', borderBottom: '5px solid #ffb400', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <div style={{ marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#7e97a7', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Account Summary for {username}</p>
                <h2 style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: '900', textTransform: 'uppercase' }}>Wallet Assets</h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
                <div style={{ position: 'relative' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#7e97a7', fontWeight: 'bold', textTransform: 'uppercase' }}>Main Balance</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '36px', fontWeight: '900', color: '#ffb400', letterSpacing: '-1px' }}>
                    <span style={{ fontSize: '14px', color: '#7e97a7', marginRight: '5px', fontWeight: 'bold' }}>PTH</span>
                    {parseFloat(balance).toLocaleString()}
                  </p>
                </div>
                <div style={{ position: 'relative' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#7e97a7', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Exposure</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '36px', fontWeight: '900', color: '#ff4444', letterSpacing: '-1px' }}>
                    {parseFloat(exposure).toLocaleString()}
                  </p>
                </div>
                <div style={{ position: 'relative' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#7e97a7', fontWeight: 'bold', textTransform: 'uppercase' }}>Available Funds</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '36px', fontWeight: '900', color: '#4caf50', letterSpacing: '-1px' }}>
                    {(parseFloat(balance) - parseFloat(exposure)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="info-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#fff', border: '1px solid #7e97a7', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#e4e4e4', padding: '10px 20px', borderBottom: '1px solid #7e97a7' }}>
                   <h4 style={{ margin: 0, fontSize: '12px', color: '#333', textTransform: 'uppercase', fontWeight: 'bold' }}>Market Settings</h4>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f4f7f9' }}>
                    <span style={{ color: '#666', fontSize: '13px', fontWeight: 'bold' }}>Currency</span>
                    <span style={{ fontWeight: '900', fontSize: '13px', color: '#3b5160' }}>PTH</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                    <span style={{ color: '#666', fontSize: '13px', fontWeight: 'bold' }}>Standard Timezone</span>
                    <span style={{ fontWeight: '900', fontSize: '13px', color: '#3b5160' }}>GMT+5:30 (IST)</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #7e97a7', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#e4e4e4', padding: '10px 20px', borderBottom: '1px solid #7e97a7' }}>
                   <h4 style={{ margin: 0, fontSize: '12px', color: '#333', textTransform: 'uppercase', fontWeight: 'bold' }}>Quick Fund Actions</h4>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => window.location.href = '/wallet/deposit'}
                      style={{ flex: 1, background: '#508d0e', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                    >
                      Deposit Funds
                    </button>
                    <button 
                      onClick={() => window.location.href = '/wallet/withdrawal'}
                      style={{ flex: 1, background: '#c0392b', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                    >
                      Withdrawal
                    </button>
                  </div>
                  <p style={{ margin: '15px 0 0 0', fontSize: '11px', color: '#999', textAlign: 'center', fontStyle: 'italic' }}>* Transactions are processed instantly via secure channels.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

export default BalanceOverviewPage;
