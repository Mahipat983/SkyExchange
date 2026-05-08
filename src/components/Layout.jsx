import React from 'react';
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
    isEditStakeModalOpen, closeEditStakeModal
  } = useUIStore();

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
