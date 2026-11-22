import { useSyncExternalStore } from 'react';

interface LayoutState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

let state: LayoutState = {
  sidebarOpen: true,
  toggleSidebar: () => {
    state = { ...state, sidebarOpen: !state.sidebarOpen };
    listeners.forEach((l) => l());
  },
  setSidebarOpen: (open: boolean) => {
    state = { ...state, sidebarOpen: open };
    listeners.forEach((l) => l());
  },
};

const listeners = new Set<() => void>();

export function useLayoutStore(): LayoutState;
export function useLayoutStore<T>(selector: (state: LayoutState) => T): T;
export function useLayoutStore<T>(selector?: (state: LayoutState) => T): T | LayoutState {
  const current = useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    () => state
  );
  return selector ? selector(current) : current;
}
