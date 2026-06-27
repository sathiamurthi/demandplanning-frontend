"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "gold" | "dark" | "light";

const THEMES: { value: Theme; label: string; icon: string }[] = [
  { value: "gold",  label: "Gold & White", icon: "✦" },
  { value: "dark",  label: "Dark",         icon: "◑" },
  { value: "light", label: "Light",        icon: "○" },
];

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  themes: typeof THEMES;
};

const ThemeContext = createContext<ThemeCtx>({
  theme: "gold",
  setTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("gold");

  // Load persisted theme on mount
  useEffect(() => {
    const saved = (localStorage.getItem("dp-theme") as Theme) || "gold";
    setThemeState(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("dp-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/* ─── Theme Switcher UI component ─── */

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);

  const current = themes.find((t) => t.value === theme) ?? themes[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium
                   transition-colors hover:bg-gray-100 border-gray-200"
        style={{
          borderColor: theme !== "light" ? "var(--tb-border, #e5e7eb)" : undefined,
          color:       theme !== "light" ? "var(--tb-text, #111827)" : undefined,
        }}
        aria-label="Switch theme"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{current.icon}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-xl border
                          bg-white py-1 shadow-lg"
            style={{ borderColor: "var(--card-border, #e5e7eb)" }}
          >
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => { setTheme(t.value); setOpen(false); }}
                className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition-colors
                  ${theme === t.value
                    ? "font-semibold text-gold-500 bg-gold-50"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="text-base">{t.icon}</span>
                {t.label}
                {theme === t.value && (
                  <svg className="ml-auto h-3.5 w-3.5 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
