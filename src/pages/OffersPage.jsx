import React, { useState, useEffect } from 'react';
import AccountLayout from './Account/AccountLayout';
import { userController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useSnackbarStore } from '../store/snackbarStore';
import '../styles/offers.css';

function OffersPage() {
  const { isLoggedIn, loginToken } = useAuthStore();
  const { show: showSnackbar } = useSnackbarStore();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, [isLoggedIn, loginToken]);

  const fetchOffers = async () => {
    if (!isLoggedIn || !loginToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await userController.getOffers(loginToken);
      if (response && typeof response === 'object' && !response.error) {
        const rawOffers = Object.values(response).filter(v => v && typeof v === 'object' && v.OfferId);
        setOffers(rawOffers);
      } else if (response && response.error === '0') {
        setOffers(response.offers || []);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferClick = async (offer) => {
    setSelectedOffer(offer);
    setDetailLoading(true);
    try {
      const response = await userController.getOfferDetail(loginToken, offer.OfferId);
      if (response) {
        let data = response;
        if (response && typeof response === 'object' && !response.detail && !response.Description) {
          const firstVal = Object.values(response).find(v => v && typeof v === 'object' && (v.detail || v.Description || v.OfferId));
          if (firstVal) data = firstVal;
        }

        if (data.detail || data.Description || data.error === '0') {
          const rawHtml = data.detail || data.Description || '';
          const cleanedHtml = rawHtml
            .replace(/[\?\uFFFD]/g, '')
            .replace(/&ndash;/g, '–')
            .trim();

          setSelectedOffer({
            ...offer,
            Description: cleanedHtml,
            Banner: data.Banner || data.image || offer.Banner,
            Eligible: data.eligible || data.Eligible
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch offer detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleClaimOffer = async () => {
    if (!selectedOffer || claiming) return;

    if (selectedOffer.Eligible?.toUpperCase() !== 'Y') {
      showSnackbar('You are not eligible for this offer.', 'error');
      return;
    }

    setClaiming(true);
    try {
      const response = await userController.claimOffer(loginToken, selectedOffer.OfferId);
      if (response.error === '0' || response.error === null) {
        showSnackbar(response.msg || 'Offer claimed successfully!', 'success');
        setSelectedOffer(null);
      } else {
        showSnackbar(response.msg || 'Failed to claim offer.', 'error');
      }
    } catch (error) {
      showSnackbar('Error claiming offer', 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <AccountLayout title="Offers">
      <div className="offers-page-content" style={{ padding: '20px' }}>
        <div className="offers-header-mini" style={{ marginBottom: '30px', borderBottom: '2px solid #3b5160', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#3b5160', textTransform: 'uppercase' }}>Available Promotions</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#7e97a7' }}>View and claim your exclusive rewards below.</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching your rewards...</p>
          </div>
        ) : !isLoggedIn ? (
          <div className="auth-notice">
            <div className="notice-icon">🎁</div>
            <h3>Exclusive Offers Await</h3>
            <p>Login to your account to view and claim personalized bonuses and promotions.</p>
            <button onClick={() => window.location.href = '/login'} className="btn-login">Login to View</button>
          </div>
        ) : offers.length === 0 ? (
          <div className="empty-state">
            <p>No offers available at the moment. Check back later!</p>
          </div>
        ) : (
          <div className="offers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {offers.map((offer) => (
              <div key={offer.OfferId} className="offer-card" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #7e97a7', overflow: 'hidden' }}>
                <div className="offer-banner" style={{ height: '150px', background: '#e4e4e4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {offer.Banner ? (
                    <img src={offer.Banner.startsWith('data:') ? offer.Banner : `data:image/png;base64,${offer.Banner}`} alt={offer.Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: '40px' }}>🎁</div>
                  )}
                </div>
                <div className="offer-info" style={{ padding: '15px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#fff', background: '#ffb400', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{offer.Category || 'Promotion'}</span>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#3b5160', margin: '10px 0 20px 0', minHeight: '36px' }}>{offer.Title}</h3>
                  <button onClick={() => handleOfferClick(offer)} className="btn-view" style={{ width: '100%', background: '#3b5160', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', fontSize: '11px' }}>View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {selectedOffer && (
          <div className="offer-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="offer-modal" style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
              <div className="modal-header" style={{ background: '#1a2d3b', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selectedOffer.Title}</h3>
                <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', lineHeight: '1' }} onClick={() => setSelectedOffer(null)}>×</button>
              </div>
              <div className="modal-body" style={{ padding: '0', maxHeight: '70vh', overflowY: 'auto' }}>
                {detailLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <>
                    <div className="modal-banner" style={{ width: '100%', background: '#eee' }}>
                      {selectedOffer.Banner && (
                        <img src={selectedOffer.Banner.startsWith('data:') ? selectedOffer.Banner : `data:image/png;base64,${selectedOffer.Banner}`} alt={selectedOffer.Title} style={{ width: '100%', display: 'block' }} />
                      )}
                    </div>
                    <div className="modal-meta" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', background: '#1a2d3b', color: '#fff', padding: '6px 12px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selectedOffer.Category || 'Promotion'}</span>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '4px', background: selectedOffer.Eligible?.toUpperCase() === 'Y' ? '#e8f5e9' : '#ffebee', color: selectedOffer.Eligible?.toUpperCase() === 'Y' ? '#2e7d32' : '#c62828' }}>
                        {selectedOffer.Eligible?.toUpperCase() === 'Y' ? '✓ Eligible' : '! Not Eligible'}
                      </span>
                    </div>
                    <div className="offer-description" style={{ padding: '20px', fontSize: '13px', lineHeight: '1.6', color: '#333' }} dangerouslySetInnerHTML={{ __html: selectedOffer.Description || 'No details available.' }} />
                    <div className="modal-actions" style={{ padding: '20px', borderTop: '1px solid #eee' }}>
                      <button
                        className={`btn-claim ${selectedOffer.Eligible?.toUpperCase() === 'Y' ? '' : 'disabled'}`}
                        style={{ width: '100%', background: selectedOffer.Eligible?.toUpperCase() === 'Y' ? '#ffb400' : '#eee', color: selectedOffer.Eligible?.toUpperCase() === 'Y' ? '#000' : '#999', border: 'none', padding: '15px', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px', cursor: selectedOffer.Eligible?.toUpperCase() === 'Y' ? 'pointer' : 'not-allowed', textTransform: 'uppercase' }}
                        disabled={claiming || selectedOffer.Eligible?.toUpperCase() !== 'Y'}
                        onClick={handleClaimOffer}
                      >
                        {claiming ? 'Claiming...' : 'Claim Offer Now'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

export default OffersPage;
