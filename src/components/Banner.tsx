import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Twitter, Share2, Check, Copy, MoreHorizontal, MessageCircle } from 'lucide-react';

/**
 * Re-exports kept for backwards compatibility with callers that imported
 * these constants from Banner. The canonical definitions live in
 * `src/utils/themes.ts` along with the seasonal theme resolution logic.
 */
export { DEFAULT_LIGHT_THEME as LIGHT_THEME, DARK_THEME } from '../utils/themes';

interface BannerProps {
    isDark: boolean;
    toggleDark: () => void;
}

const SHARE_TEXT = 'ミリシタ・ボーダー予想 — Yueni';

/**
 * Share popover anchored under the share button. Offers explicit platform
 * targets (X, LINE), a copy-URL action, and — on devices that support it —
 * the OS native share sheet for everything else (Bluesky, Discord, etc.).
 */
const SharePopover: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on outside click and on Escape.
    useEffect(() => {
        if (!open) return;
        const onDocPointer = (e: PointerEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onDocPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onDocPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    // Reset the "copied" state after a short delay.
    useEffect(() => {
        if (!copied) return;
        const t = window.setTimeout(() => setCopied(false), 1500);
        return () => window.clearTimeout(t);
    }, [copied]);

    const url = typeof window !== 'undefined' ? window.location.href : '';
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(SHARE_TEXT);

    const xHref = `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    const lineHref = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedText}`;

    const supportsNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
        } catch {
            window.prompt('このURLをコピーしてください', url);
        }
    };

    const handleNativeShare = async () => {
        try {
            await navigator.share({ url, title: document.title || 'Yueni', text: SHARE_TEXT });
            setOpen(false);
        } catch {
            /* user cancelled or browser refused */
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Share this page"
                title="シェア"
                className="btn btn-ghost btn-sm btn-square"
            >
                <Share2 size={18} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        role="menu"
                        className="absolute right-0 mt-2 w-48 bg-base-100 border border-base-300 rounded-lg shadow-lg overflow-hidden z-50"
                    >
                        <a
                            role="menuitem"
                            href={xHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-200 transition-colors"
                        >
                            <Twitter size={16} className="shrink-0" />
                            <span>Xでシェア</span>
                        </a>
                        <a
                            role="menuitem"
                            href={lineHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-200 transition-colors"
                        >
                            <MessageCircle size={16} className="shrink-0" />
                            <span>LINEでシェア</span>
                        </a>
                        <button
                            role="menuitem"
                            type="button"
                            onClick={handleCopy}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-200 transition-colors text-left"
                        >
                            {copied ? <Check size={16} className="shrink-0" /> : <Copy size={16} className="shrink-0" />}
                            <span>{copied ? 'コピーしました' : 'リンクをコピー'}</span>
                        </button>
                        {supportsNativeShare && (
                            <button
                                role="menuitem"
                                type="button"
                                onClick={handleNativeShare}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-200 transition-colors text-left border-t border-base-300"
                            >
                                <MoreHorizontal size={16} className="shrink-0" />
                                <span>その他...</span>
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Banner: React.FC<BannerProps> = ({ isDark, toggleDark }) => {
    const [open, setOpen] = useState(false);
    // The panel must clip during the height animation, otherwise the
    // collapsing/expanding content spills out. Once fully open we switch to
    // visible so the share popover can extend past the panel's bounds.
    const [panelClipped, setPanelClipped] = useState(true);

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
                        <SharePopover />
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
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            onAnimationStart={() => setPanelClipped(true)}
                            onAnimationComplete={() => { if (open) setPanelClipped(false); }}
                            className={`${panelClipped ? 'overflow-hidden' : 'overflow-visible'} sm:hidden`}
                        >
                            <div className="py-3 flex items-center justify-end gap-3">
                                <SharePopover />
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
