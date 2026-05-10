import { create } from 'zustand';

interface UiStore {
  sidebarOpen: boolean;
  activeModal: string | null;
  notification: string | null;
  openSidebar: () => void;
  closeSidebar: () => void;
  setActiveModal: (modal: string | null) => void;
  setNotification: (message: string | null) => void;
  resetUi: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  notification: null,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  setActiveModal: (modal) => set({ activeModal: modal }),
  setNotification: (message) => set({ notification: message }),
  resetUi: () => set({ sidebarOpen: true, activeModal: null, notification: null }),
}));
