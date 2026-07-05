"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { adminAPI } from "@/lib/api";

const defaultSettings = {
  appearance: {
    theme: "light", // light, dark, system
    sidebarStyle: "expanded",
    accentColor: "#3b82f6",
    layoutWidth: "full",
  },
  dashboard: {
    widgets: ["revenue", "bookings", "technicians", "active_tasks", "service_trends"],
    landingPage: "dashboard",
  },
  table: {
    rowsPerPage: 10,
    defaultSort: { key: "created_at", direction: "desc" },
    density: "comfortable",
  },
  notifications: {
    bookingAlerts: true,
    technicianUpdates: true,
    systemAlerts: true,
    channels: ["in-app", "email"],
  },
  search: {
    saveDefaultFilters: true,
    autoApplyFilters: true,
    searchBehavior: "instant", // instant, manual
  },
  productivity: {
    keyboardShortcuts: true,
    quickActions: true,
    autoRefresh: 30, // 30, 60, 0 (off)
  },
  localization: {
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    numberFormat: "en-US",
  },
  security: {
    sessionTimeout: 15,
    twoFactor: false,
    loginAlerts: true,
    disableInspect: false,
  },
  smartAdmin: {
    aiInsights: true,
    highlightMetrics: true,
    autoSuggest: true,
  },
  uiBehavior: {
    confirmDialogs: true,
    navigationStyle: "page", // modal, page
    stickyHeader: true,
  }
};

const SettingsContext = createContext<{
  settings: typeof defaultSettings;
  updateSettings: (group: string, values: any) => Promise<void>;
  toggleTheme: () => void;
  loading: boolean;
} | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Apply visual settings to Document
  const applyVisuals = useCallback((s: typeof defaultSettings) => {
    if (typeof document === "undefined") return;
    
    const root = document.documentElement;
    
    // Theme
    let actualTheme = s.appearance.theme;
    if (actualTheme === "system") {
      actualTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    if (actualTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Accent Color
    root.style.setProperty("--primary", s.appearance.accentColor);
    
    // Density
    root.style.setProperty("--table-cell-py", s.table.density === "compact" ? "0.375rem" : "1rem");
  }, []);

  // Fetch from DB on load
  useEffect(() => {
    async function loadSettings() {
      // 1. Load from localStorage for instant switch
      const local = localStorage.getItem("efm_admin_prefs");
      if (local) {
        const parsed = JSON.parse(local);
        setSettings(parsed);
        applyVisuals(parsed);
      }

      try {
        const res = await adminAPI.getSettings();
        if (res.status && res.data && Object.keys(res.data).length > 0) {
          const merged = { ...defaultSettings, ...res.data };
          setSettings(merged);
          applyVisuals(merged);
          localStorage.setItem("efm_admin_prefs", JSON.stringify(merged));
        }
      } catch (err) {
        console.error("Failed to load cloud settings", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [applyVisuals]);

  const updateSettings = async (group: string, values: any) => {
    const newSettings = {
      ...settings,
      [group]: { ...settings[group as keyof typeof settings], ...values }
    };
    
    setSettings(newSettings);
    applyVisuals(newSettings);
    localStorage.setItem("efm_admin_prefs", JSON.stringify(newSettings));

    try {
      await adminAPI.updateSettings(newSettings);
    } catch (err) {
      console.error("Failed to sync settings to DB", err);
    }
  };

  const toggleTheme = () => {
    const nextTheme = settings.appearance.theme === "light" ? "dark" : "light";
    updateSettings("appearance", { theme: nextTheme });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, toggleTheme, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
