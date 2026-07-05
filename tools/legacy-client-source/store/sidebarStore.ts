import { create } from "zustand"
import { persist } from "zustand/middleware"

type SidebarState = {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebar: (value: boolean) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      sidebarOpen: true,

      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),

      setSidebar: (value) =>
        set(() => ({
          sidebarOpen: value,
        })),
    }),
    {
      name: "fixmate-sidebar", // localStorage key
    }
  )
)