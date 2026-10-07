import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface SidebarStore {
    isOpen: boolean
    hasHydrated: boolean
    setIsOpen: (open: boolean | ((prev: boolean) => boolean)) => void
    toggleSidebar: () => void
    setHasHydrated: (hydrated: boolean) => void
}

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const SIDEBAR_STORAGE_KEY = "lis_cmu_sidebar_state"

const safeStorage = {
    getItem: (name: string): string | null => {
        if (typeof window === "undefined") return null
        try {
            return window.localStorage.getItem(name)
        } catch {
            return null
        }
    },
    setItem: (name: string, value: string): void => {
        if (typeof window === "undefined") return
        try {
            window.localStorage.setItem(name, value)
        } catch {}
    },
    removeItem: (name: string): void => {
        if (typeof window === "undefined") return
        try {
            window.localStorage.removeItem(name)
        } catch {}
    },
}

const getInitialOpenState = (): boolean => {
    if (typeof window === "undefined") return true
    try {
        // 1. ตรวจสอบ cookie ก่อน (อิงตามมาตรฐาน shadcn)
        const match = document.cookie.match(/sidebar_state=(true|false)/)
        if (match) {
            return match[1] === "true"
        }
        // 2. ตรวจสอบ localStorage
        const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            if (typeof parsed?.state?.isOpen === "boolean") {
                return parsed.state.isOpen
            }
        }
    } catch {
        // ignore
    }
    return true
}

export const useSidebarStore = create<SidebarStore>()(
    persist(
        (set, get) => ({
            isOpen: getInitialOpenState(),
            hasHydrated: false,
            setIsOpen: (value) => {
                const nextOpen = typeof value === "function" ? value(get().isOpen) : value
                set({ isOpen: nextOpen })
                if (typeof document !== "undefined") {
                    document.cookie = `${SIDEBAR_COOKIE_NAME}=${nextOpen}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
                }
            },
            toggleSidebar: () => {
                const nextOpen = !get().isOpen
                set({ isOpen: nextOpen })
                if (typeof document !== "undefined") {
                    document.cookie = `${SIDEBAR_COOKIE_NAME}=${nextOpen}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
                }
            },
            setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
        }),
        {
            name: SIDEBAR_STORAGE_KEY,
            storage: createJSONStorage(() => safeStorage),
            partialize: (state) => ({ isOpen: state.isOpen } as any),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true)
            },
        }
    )
)
