/**
 * Format a past timestamp as a short Japanese relative-time string.
 *
 *   < 1 min ago    → "たった今"
 *   < 60 min ago   → "X分前"
 *   < 24 hr ago    → "X時間前"
 *   < 7 days ago   → "X日前"
 *   older          → absolute date "YYYY/MM/DD HH:mm" (JST)
 *
 * Returns null if the input is not a valid Date.
 */
export function formatRelativeTimeJa(date: Date | null | undefined, now: Date = new Date()): string | null {
    if (!date || Number.isNaN(date.getTime())) return null;

    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'たった今'; // future timestamp, treat as fresh

    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;

    const hours = Math.floor(diffMs / 3_600_000);
    if (hours < 24) return `${hours}時間前`;

    const days = Math.floor(diffMs / 86_400_000);
    if (days < 7) return `${days}日前`;

    // Older than a week: show absolute date+time in JST with timezone suffix.
    const formatted = date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo',
    });
    return `${formatted} JST`;
}
