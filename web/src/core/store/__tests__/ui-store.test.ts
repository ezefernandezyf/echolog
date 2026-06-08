import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '../ui-store';

describe('UiStore — toggleSidebar', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useUiStore.setState({
      sidebarOpen: true,
      activeModal: null,
      notification: null,
    });
  });

  it('toggles sidebarOpen from true to false', () => {
    expect(useUiStore.getState().sidebarOpen).toBe(true);

    useUiStore.getState().toggleSidebar();

    expect(useUiStore.getState().sidebarOpen).toBe(false);
  });

  it('toggles sidebarOpen from false to true', () => {
    useUiStore.setState({ sidebarOpen: false });
    expect(useUiStore.getState().sidebarOpen).toBe(false);

    useUiStore.getState().toggleSidebar();

    expect(useUiStore.getState().sidebarOpen).toBe(true);
  });

  it('double toggle returns to original state', () => {
    expect(useUiStore.getState().sidebarOpen).toBe(true);

    useUiStore.getState().toggleSidebar();
    useUiStore.getState().toggleSidebar();

    expect(useUiStore.getState().sidebarOpen).toBe(true);
  });

  it('toggleSidebar is a function in the store', () => {
    const state = useUiStore.getState();
    expect(typeof state.toggleSidebar).toBe('function');
  });
});
