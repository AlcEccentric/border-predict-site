import React, { useEffect, useState } from 'react';
import { isSeasonalTheme } from '../utils/themes';

/**
 * Rendered when there's no active event or the prediction data is invalid.
 * Two character chat bubbles normally use fixed character colors so the
 * visual identity stays constant. During seasonal theme windows we switch
 * to daisyUI's themed `chat-bubble-*` classes so the special palette
 * extends to this page too.
 */
const EventModal: React.FC = () => {
    // Track the active theme from <html data-theme="...">. We read from the
    // DOM rather than via context so this component works even when
    // rendered before `useTheme()` has been called (early-return paths).
    const [themed, setThemed] = useState<boolean>(() => {
        if (typeof document === 'undefined') return false;
        return isSeasonalTheme(document.documentElement.getAttribute('data-theme') || '');
    });

    useEffect(() => {
        const root = document.documentElement;
        const sync = () => {
            setThemed(isSeasonalTheme(root.getAttribute('data-theme') || ''));
        };
        // Theme can change live when the user toggles dark/light or when a
        // seasonal window boundary passes.
        const observer = new MutationObserver(sync);
        observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            {/* Mizuki */}
            <div className="chat chat-start max-w-lg">
                <div
                    className={themed ? 'chat-bubble chat-bubble-secondary' : 'chat-bubble'}
                    style={themed ? undefined : { backgroundColor: '#c8dcee', color: '#1f2937' }}
                >
                    ……どうやら、いまはイベントが開催されていないようです。
                    それか……まだ対応していないのかもしれませんね。
                </div>
            </div>

            {/* Haruka */}
            <div className="chat chat-end max-w-lg">
                <div
                    className={themed ? 'chat-bubble chat-bubble-primary' : 'chat-bubble'}
                    style={themed ? undefined : { backgroundColor: '#f79a9c', color: 'white' }}
                >
                    そっか〜。じゃあ、次を楽しみにしよっ♪
                    始まったら、また一緒にがんばろうねっ！
                </div>
            </div>
        </div>
    );
};

export default EventModal;
