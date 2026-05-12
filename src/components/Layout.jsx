import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DesktopHeader from './DesktopHeader';
import MobileHeader from './MobileHeader';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import GameOverlay from './GameOverlay';
import EditStakeModal from './EditStakeModal';
import { useUIStore } from '../store/uiStore';
import { userController } from '../controllers';

function Layout({ children }) {
  const {
    isLoginModalOpen, closeLoginModal,
    isSignupModalOpen, closeSignupModal,
    overlay, closeOverlay,
    isEditStakeModalOpen, closeEditStakeModal,
    openLoginModal, openSignupModal
  } = useUIStore();

  const location = useLocation();
  const navigate = useNavigate();
  const [whatsappLink, setWhatsappLink] = useState('https://go.wa.link/ambikaexchangesupport');

  useEffect(() => {
    const fetchWhatsApp = async () => {
      try {
        const res = await userController.getWhatsAppLink();
        if (res && res.error === '0' && res.Link) {
          setWhatsappLink(res.Link);
        } else if (res && res.url) {
          setWhatsappLink(res.url);
        } else if (res && typeof res === 'string' && res.startsWith('http')) {
          setWhatsappLink(res);
        }
      } catch (err) {
        console.error('Failed to fetch WhatsApp link:', err);
      }
    };
    fetchWhatsApp();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let changed = false;
    if (params.get('login') === 'true') {
      openLoginModal();
      params.delete('login');
      changed = true;
    }
    if (params.get('signup') === 'true') {
      openSignupModal();
      params.delete('signup');
      changed = true;
    }
    if (params.get('forgot') === 'true') {
      openLoginModal('forgot');
      params.delete('forgot');
      changed = true;
    }
    if (changed) {
      const newSearch = params.toString();
      navigate({
        pathname: location.pathname,
        search: newSearch ? `?${newSearch}` : ''
      }, { replace: true });
    }
  }, [location.search, location.pathname, openLoginModal, openSignupModal, navigate]);

  return (
    <>
      {/* Desktop elements - hidden on mobile via CSS */}
      <div className="desktop-only">
        <DesktopHeader />
      </div>

      {/* Mobile header - hidden on desktop via CSS */}
      <div className="mobile-only">
        <MobileHeader />
      </div>


      {/* Modals */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      <SignupModal />
      <EditStakeModal isOpen={isEditStakeModalOpen} onClose={closeEditStakeModal} />

      {/* Global Game Overlay */}
      <GameOverlay
        isOpen={overlay.isOpen}
        url={overlay.url}
        title={overlay.title}
        onClose={closeOverlay}
      />

      {/* Page content */}
      {children}

      {/* Global WhatsApp Floating Button */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-btn whatsapp-float"
        style={{ right: '20px' }}
      >
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" width="35" height="35" />
      </a>

      {/* Mobile Only Floating Buttons */}
      <div className="mobile-only">
        {location.pathname === '/' && (
          <a
            href="/casino"
            className="floating-btn casino-float"
            style={{ left: '20px' }}
          >
            <img src="/images/promot.svg" alt="Casino" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </a>
        )}
      </div>

      <style>{`
        .floating-btn {
          position: fixed;
          bottom: 100px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4);
          z-index: 9999;
          transition: transform 0.2s, box-shadow 0.2s;
          border: none;
        }
        .floating-btn:active {
          transform: scale(0.9);
        }
        .casino-float {
          background: none;
          box-shadow: none;
          animation: pulse-gold 2s infinite;
        }
        .whatsapp-float {
          background: #25d366;
          animation: pulse-green 2s infinite;
        }
        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255, 180, 0, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(255, 180, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 180, 0, 0); }
        }
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
      `}</style>
    </>
  );
}

export default Layout;
