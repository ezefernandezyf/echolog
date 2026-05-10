import { create } from 'zustand';

export type UiModal = 'create-workspace' | 'create-post' | null;

interface UiStore {
  sidebarOpen: boolean;
  activeModal: UiModal;
  notification: string | null;
  openSidebar: () => void;
  closeSidebar: () => void;
  openModal: (modal: Exclude<UiModal, null>) => void;
  closeModal: () => void;
  setNotification: (message: string | null) => void;
  resetUi: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  notification: null,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setNotification: (message) => set({ notification: message }),
  resetUi: () => set({ sidebarOpen: true, activeModal: null, notification: null }),
}));
