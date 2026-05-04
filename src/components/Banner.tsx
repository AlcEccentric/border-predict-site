import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Twitter } from 'lucide-react';

/**
 * Two daisyUI themes drive light/dark mode. The names must match entries in
 * tailwind.config.js -> daisyui.themes, and are persisted under the same
 * localStorage key the rest of the app uses ("theme").
 */
export const LIGHT_THEME = 'cupcake';
export const DARK_THEME = 'dim';

interface BannerProps {
    theme: string;
    setTheme: (theme: string) => void;
}

const Banner: React.FC<BannerProps> = ({ theme, setTheme }) => {
    const [open, setOpen] = useState(false);
    const isDark = theme === DARK_THEME;

    const applyTheme = (next: string) => {
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        try {
            localStorage.setItem('theme', next);
        } catch {
            /* storage may be disabled; non-fatal */
        }
    };

    const toggleDark = () => applyTheme(isDark ? LIGHT_THEME : DARK_THEME);

    return (
        <header className="sticky top-0 z-40 w-full bg-base-200/90 backdrop-blur border-b border-base-300 shadow-sm">
            <div className="px-4 sm:px-6">
                {/* Top row: wordmark on the left, controls on the right */}
                <div className="flex items-center justify-between h-14">
                    <a
                        href="/"
                        className="flex items-baseline gap-2 hover:text-primary transition-colors"
                        aria-label="Yueni home"
                    >
                        <span className="text-xl sm:text-2xl font-bold tracking-wide text-base-content">
                            Yueni
                        </span>
                        <span className="text-xs text-base-content/60 font-normal">
                            …なんです
                        </span>
                    </a>

                    {/* Wide screens: show controls inline and hide the menu toggle. */}
                    <div className="hidden sm:flex items-center gap-1">
                        <a
                            href="https://x.com/YueniMillionB1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm btn-square"
                            aria-label="Follow @YueniMillionB1 on X"
                            title="@YueniMillionB1"
                        >
                            <Twitter size={18} />
                        </a>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isDark}
                            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            onClick={toggleDark}
                            className="btn btn-ghost btn-sm btn-square"
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>

                    {/* Narrow screens: collapse the controls behind a menu toggle. */}
                    <button
                        type="button"
                        className="sm:hidden btn btn-ghost btn-sm btn-square"
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                        onClick={() => setOpen(v => !v)}
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Expandable panel: only used on narrow screens. */}
                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div
                            key="panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="overflow-hidden sm:hidden"
                        >
                            <div className="py-3 flex items-center justify-end gap-3">
                                <a
                                    href="https://x.com/YueniMillionB1"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-ghost btn-sm btn-square"
                                    aria-label="Follow @YueniMillionB1 on X"
                                    title="@YueniMillionB1"
                                >
                                    <Twitter size={18} />
                                </a>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isDark}
                                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                                    onClick={toggleDark}
                                    className="btn btn-ghost btn-sm btn-square"
                                >
                                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

export default Banner;
