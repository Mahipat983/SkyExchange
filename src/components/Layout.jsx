import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DesktopHeader from './DesktopHeader';
import MobileHeader from './MobileHeader';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import GameOverlay from './GameOverlay';
import EditStakeModal from './EditStakeModal';
import { useUIStore } from '../store/uiStore';

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
    </>
  );
}

export default Layout;
