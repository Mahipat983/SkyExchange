import React, { useState, useEffect } from 'react';
import AccountLayout from './AccountLayout';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { userController } from '../../controllers';
import { useAuthStore } from '../../store/authStore';

function ProfilePage() {
  const { loginToken, isLoggedIn } = useAuthStore();
  const [turnoverMsg, setTurnoverMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  const fetchTurnover = async () => {
    if (!isLoggedIn || !loginToken) return;
    try {
      setLoading(true);
      const res = await userController.getTurnover(loginToken);
      if (res && res.error === '0') {
        setTurnoverMsg(res.msg || '');
      } else {
        setTurnoverMsg('No turnover data available at the moment.');
      }
    } catch (err) {
      console.error('Failed to fetch turnover:', err);
      setTurnoverMsg('Error loading activity data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnover();
  }, [isLoggedIn, loginToken]);

  return (
    <AccountLayout title="Profile">
      <div className="profile-container" style={{ padding: '20px', maxWidth: '800px' }}>
        <div className="profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #3b5160', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#3b5160', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Activity</h2>
          <button 
            onClick={fetchTurnover} 
            disabled={loading}
            style={{ background: '#3b5160', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
            title="Refresh"
          >
            <svg className={loading ? 'animate-spin' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path></svg>
          </button>
        </div>

        <div className="turnover-card" style={{ background: '#f4f7f9', padding: '25px', borderRadius: '8px', border: '1px solid #7e97a7', marginBottom: '30px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#ffb400' }}></div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#3b5160' }}>
              <div className="animate-spin" style={{ width: '18px', height: '18px', border: '3px solid #ffb400', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Syncing activity data...</span>
            </div>
          ) : (
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2c3e50', lineHeight: '1.6' }}>
              {turnoverMsg || 'Your account is active. Start betting to see your turnover details here.'}
            </div>
          )}
        </div>

        <div className="security-section" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden' }}>
          <div style={{ background: '#3b5160', padding: '10px 20px', color: '#fff' }}>
             <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Security & Settings</h3>
          </div>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Account Password</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '15px', fontWeight: 'bold', color: '#333', letterSpacing: '2px' }}>••••••••••••••••</p>
            </div>
            <button 
              onClick={() => setPasswordModalOpen(true)}
              style={{ background: '#ffb400', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
            >
              EDIT PASSWORD ✎
            </button>
          </div>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
      />
    </AccountLayout>
  );
}

export default ProfilePage;
