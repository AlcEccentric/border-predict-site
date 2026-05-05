/**
 * Theme resolution with time-boxed overrides.
 *
 * The app exposes two modes to the user — light and dark — but the *actual*
 * daisyUI theme name used for light mode can be swapped during seasonal
 * windows defined below. When no seasonal window is active we fall back to
 * DEFAULT_LIGHT_THEME.
 *
 * All windows are expressed in UTC so the boundary doesn't drift with the
 * visitor's local timezone.
 */

export const DEFAULT_LIGHT_THEME = 'cupcake';
export const DARK_THEME = 'dim';

interface SeasonalWindow {
    lightTheme: string;
    darkTheme: string;
    /** ISO-8601 UTC timestamp; inclusive. */
    start: string;
    /** ISO-8601 UTC timestamp; exclusive. */
    end: string;
}

const SEASONAL_WINDOWS: SeasonalWindow[] = [
    {
        lightTheme: 'yueni-may',
        darkTheme: 'yueni-may-dark',
        start: '2026-05-05T07:00:00Z',
        end: '2026-05-18T14:59:59Z',
    },
];

/** Returns the daisyUI theme name that should back "light mode" right now. */
export function getActiveLightTheme(now: Date = new Date()): string {
    const nowMs = now.getTime();
    for (const w of SEASONAL_WINDOWS) {
        const s = new Date(w.start).getTime();
        const e = new Date(w.end).getTime();
        if (nowMs >= s && nowMs < e) return w.lightTheme;
    }
    return DEFAULT_LIGHT_THEME;
}

/** Returns the daisyUI theme name that should back "dark mode" right now. */
export function getActiveDarkTheme(now: Date = new Date()): string {
    const nowMs = now.getTime();
    for (const w of SEASONAL_WINDOWS) {
        const s = new Date(w.start).getTime();
        const e = new Date(w.end).getTime();
        if (nowMs >= s && nowMs < e) return w.darkTheme;
    }
    return DARK_THEME;
}

/**
 * Milliseconds until the next seasonal window boundary (start or end), or
 * null if there are no future boundaries. Callers use this to schedule a
 * re-evaluation so the theme flips at exactly the right moment without
 * requiring the user to reload.
 */
export function msUntilNextThemeBoundary(now: Date = new Date()): number | null {
    const nowMs = now.getTime();
    let next = Infinity;
    for (const w of SEASONAL_WINDOWS) {
        const s = new Date(w.start).getTime();
        const e = new Date(w.end).getTime();
        if (s > nowMs) next = Math.min(next, s);
        if (e > nowMs) next = Math.min(next, e);
    }
    return next === Infinity ? null : next - nowMs;
}

export function isDarkTheme(theme: string): boolean {
    return theme === DARK_THEME;
}

/** True when the given theme belongs to any seasonal window (active or not). */
export function isSeasonalTheme(theme: string): boolean {
    return SEASONAL_WINDOWS.some(w => w.lightTheme === theme || w.darkTheme === theme);
}

/** Every theme name the app may hand out — useful for validating stored prefs. */
export function allKnownThemes(): string[] {
    return [
        DEFAULT_LIGHT_THEME,
        DARK_THEME,
        ...SEASONAL_WINDOWS.flatMap(w => [w.lightTheme, w.darkTheme]),
    ];
}

/**
 * Hook that owns theme state: persists the user's preferred mode
 * (light/dark), resolves it to the correct daisyUI theme name, and
 * re-evaluates when a seasonal window starts or ends so the page updates
 * live without a reload.
 */
import { useCallback, useEffect, useState } from 'react';

type Mode = 'light' | 'dark';
const MODE_STORAGE_KEY = 'yueni-theme-mode';
// Legacy key from when we stored the theme name directly; read once on
// first load so returning visitors don't lose their dark-mode preference.
const LEGACY_KEY = 'theme';

function readInitialMode(): Mode {
    try {
        const saved = localStorage.getItem(MODE_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;

        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy === DARK_THEME) return 'dark';
        if (legacy) return 'light';
    } catch {
        /* storage may be disabled */
    }
    const prefersDark = typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
}

export function useTheme(): { theme: string; isDark: boolean; toggleDark: () => void } {
    const [mode, setMode] = useState<Mode>(readInitialMode);
    const [, tick] = useState(0);

    // Re-evaluate the active theme when a seasonal window boundary passes.
    useEffect(() => {
        const ms = msUntilNextThemeBoundary();
        if (ms === null) return;
        // Add a small buffer so we re-render just after the boundary.
        const t = window.setTimeout(() => tick(n => n + 1), ms + 50);
        return () => window.clearTimeout(t);
    }, [mode]);

    const theme = mode === 'dark' ? getActiveDarkTheme() : getActiveLightTheme();

    // Keep the `data-theme` attribute in sync on every render. This runs
    // inside the render body (a rare pattern, but safe when the write is
    // idempotent) so the DOM reflects the current theme BEFORE child
    // components read CSS via `getComputedStyle`. A `useEffect` /
    // `useLayoutEffect` would fire too late — child `useMemo`s that read
    // computed styles during render would see the previous theme's values.
    if (typeof document !== 'undefined'
        && document.documentElement.getAttribute('data-theme') !== theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    // Persistence isn't paint-critical; regular useEffect is fine.
    useEffect(() => {
        try {
            localStorage.setItem(MODE_STORAGE_KEY, mode);
        } catch {
            /* ignore */
        }
    }, [mode]);

    const toggleDark = useCallback(() => {
        setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    return { theme, isDark: mode === 'dark', toggleDark };
}
