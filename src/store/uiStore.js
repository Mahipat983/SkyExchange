import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isLoginModalOpen: false,
  loginModalView: 'login', // 'login' or 'forgot'
  openLoginModal: (view = 'login') => set({ isLoginModalOpen: true, loginModalView: view }),
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
  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  isEditStakeModalOpen: false,
  openEditStakeModal: () => set({ isEditStakeModalOpen: true }),
  closeEditStakeModal: () => set({ isEditStakeModalOpen: false }),
}));
