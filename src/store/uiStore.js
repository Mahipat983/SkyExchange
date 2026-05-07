import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isLoginModalOpen: false,
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),

  isSignupModalOpen: false,
  openSignupModal: () => set({ isSignupModalOpen: true }),
  closeSignupModal: () => set({ isSignupModalOpen: false }),

  overlay: {
    isOpen: false,
    url: '',
    title: ''
  },
  openOverlay: (url, title) => set({ 
    overlay: { isOpen: true, url, title } 
  }),
  closeOverlay: () => set({ 
    overlay: { isOpen: false, url: '', title: '' } 
  }),
}));
