import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * useUIStore
 * Centralized store for layout and UI state.
 * Optimized for high-frequency updates without triggering full-page re-renders.
 */
export const useUIStore = create(
    persist(
        (set) => ({
            // ── Sidebar State ──────────────────────────────────────────
            isSidebarExpanded: true,
            isCollapsed: false,
            
            // ── Sidebar Actions ───────────────────────────────────────
            toggleSidebar: () => set((state) => ({ 
                isSidebarExpanded: !state.isSidebarExpanded 
            })),
            setSidebarExpanded: (val) => set({ isSidebarExpanded: val }),
            
            toggleCollapse: () => set((state) => ({ 
                isCollapsed: !state.isCollapsed 
            })),
            setCollapsed: (val) => set({ isCollapsed: val }),

            // ── Performance/Loading States ────────────────────────────
            isPending: false,
            setPending: (val) => set({ isPending: val }),

            // ── Breadcrumbs / Dynamic Header ──────────────────────────
            headerTitle: '',
            setHeaderTitle: (val) => set({ headerTitle: val }),
        }),
        {
            name: 'klivra-ui-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                isSidebarExpanded: state.isSidebarExpanded, 
                isCollapsed: state.isCollapsed 
            }),
        }
    )
);
