const JP_TIMEZONE = 'Asia/Tokyo';

export const convertToJST = (dateStr: string): Date => {
    return new Date(new Date(dateStr).toLocaleString('en-US', {timeZone: JP_TIMEZONE}));
};

export const isEventOngoing = (startAt: string, endAt: string): boolean => {
    const now = new Date(new Date().toLocaleString('en-US', {timeZone: JP_TIMEZONE}));
    const start = convertToJST(startAt);
    const end = convertToJST(endAt);
    return now >= start && now <= end;
};

export const calculateTimePoints = (
    startAt: string,
    dataLength: number
): Date[] => {
    const start = convertToJST(startAt);
    return Array.from({ length: dataLength }, (_, i) => {
        const point = new Date(start);
        point.setMinutes(point.getMinutes() + i * 30);
        return point;
    });
};

// Helper function to format date to JST string
export const formatJSTDateTime = (date: Date): string => {
    return date.toLocaleString('ja-JP', {
        timeZone: JP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};