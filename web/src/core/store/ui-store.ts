import { create } from 'zustand';

export type UiModal = 'create-workspace' | 'create-post' | 'create-board' | null;
export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'echolog-theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable (SSR or privacy mode)
  }

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // silently ignore
  }
}

interface UiStore {
  sidebarOpen: boolean;
  activeModal: UiModal;
  notification: string | null;
  theme: Theme;
  openSidebar: () => void;
  closeSidebar: () => void;
  openModal: (modal: Exclude<UiModal, null>) => void;
  closeModal: () => void;
  setNotification: (message: string | null) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resetUi: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  notification: null,
  theme: getInitialTheme(),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  openModal: (modal) => {
    if (import.meta.env.DEV) {
      console.log('[ui-store] openModal:', modal);
    }
    set({ activeModal: modal });
  },
  closeModal: () => {
    if (import.meta.env.DEV) {
      console.log('[ui-store] closeModal');
    }
    set({ activeModal: null });
  },
  setNotification: (message) => set({ notification: message }),
  setTheme: (theme) => {
    persistTheme(theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      persistTheme(next);
      return { theme: next };
    }),
  resetUi: () =>
    set((state) => ({ sidebarOpen: true, activeModal: null, notification: null, theme: state.theme })),
}));
