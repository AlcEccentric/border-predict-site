import React, { useEffect, useState } from 'react';
import { formatRelativeTimeJa } from '../utils/relativeTime';

interface LastUpdatedProps {
    /** Timestamp of the data's last server-side modification. */
    timestamp: Date | null | undefined;
    /** Optional CSS classes to override placement / alignment. */
    className?: string;
}

/**
 * Tiny muted label showing when the displayed data was last refreshed,
 * e.g. "データ更新: 2時間前". Re-renders every minute so the relative
 * label stays accurate while the page is open.
 *
 * Renders nothing if no timestamp is available.
 */
const LastUpdated: React.FC<LastUpdatedProps> = ({ timestamp, className = '' }) => {
    // Tick state to force a re-format every minute. Cheap; the formatter
    // and the surrounding component are very small.
    const [, tick] = useState(0);
    useEffect(() => {
        const id = window.setInterval(() => tick(n => n + 1), 60_000);
        return () => window.clearInterval(id);
    }, []);

    const label = formatRelativeTimeJa(timestamp);
    if (!label) return null;

    // Absolute timestamp shown on hover for users who care about exact value.
    const tooltip = timestamp
        ? `${timestamp.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} JST`
        : undefined;

    return (
        <span
            className={`text-xs text-base-content/60 ${className}`}
            title={tooltip}
        >
            最終更新: {label}
        </span>
    );
};

export default LastUpdated;
