import React, { useCallback, useEffect, useRef, useState } from 'react';
import EventModal from './components/EventModal';
import MaintenancePage from './components/MaintenancePage';
import { EventInfo, PredictionData, IdolPredictionData } from './types';
import { isEventOngoing } from './utils/dateUtils';
import BorderTabs from './components/BorderTabs';
import Type5EventPage from './components/Type5EventPage';
import FAQ from './components/FAQ';
import CardContainer from './components/CardContainer';
import Banner from './components/Banner';
import UpdatesButton from './components/UpdatesButton';
import { useTheme } from './utils/themes';
import { discoverAvailableIdols, loadIdolPrediction } from './utils/type5Loader';

const App: React.FC = () => {
    const releaseDate = new Date('2025-06-01T00:00:00+09:00');
    const now = new Date();
    if (now < releaseDate) { 
        return <EventModal />;
    }
    const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
    const [prediction100, setPrediction100] = useState<PredictionData | null>(null);
    const [prediction2500, setPrediction2500] = useState<PredictionData | null>(null);
    const [idolPredictions, setIdolPredictions] = useState<Map<number, IdolPredictionData>>(new Map());
    const [availableIdols, setAvailableIdols] = useState<Set<number>>(new Set());
    const [loadingIdols, setLoadingIdols] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [predictionDataValid, setPredictionDataValid] = useState(true);
    const [activeTab, setActiveTab] = useState(() => {
        const savedActiveTab = localStorage.getItem('activeTab');
        return savedActiveTab || '100';
    });
    // Debug mode: launched via `npm run dev:debug` (sets VITE_DEBUG=1).
    // Appends ?debug to fetches to bypass the CDN cache so the latest
    // uncached predictions are rendered. Never enabled in a production build.
    const isDebug = import.meta.env.VITE_DEBUG === '1'
        || import.meta.env.VITE_DEBUG === 'true';
    const debugSuffix = isDebug ? '?debug' : '';

    // Allow overriding the data base URL for local testing against a
    // different bucket / mock server. Falls back to the production CDN.
    const baseUrlEnv = import.meta.env.VITE_DATA_BASE_URL as string | undefined;
    const baseUrl = baseUrlEnv && baseUrlEnv.length > 0
        ? baseUrlEnv
        : 'https://cdn.yuenimillion.live/data';

    // Force the page into a particular event type for local testing,
    // regardless of what `latest_event_border_info.json` says. Useful for
    // checking the Type 5 layout when no Type 5 event is currently running.
    // The actual prediction data still comes from `baseUrl`, so any
    // historical data left at the unversioned paths will be used.
    //
    // Examples:
    //   ?type5Demo=true        → Type 5 page (event id 388 by default)
    //   ?type5Demo=true&eventId=388&eventName=テスト → custom labels
    const params = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    const forceType5Demo = params.get('type5Demo') === 'true' || params.get('type5Demo') === '1';
    const demoEventId = Number(params.get('eventId') ?? 388);
    const demoEventName = params.get('eventName') ?? 'デモイベント (Type 5)';
    
    // Maintenance mode configuration
    const isMaintenanceMode = false; // Set to true to enable maintenance mode
    const maintenanceEndTime = '2025-10-21 15:00 JST'; // Customize maintenance end time
    const { theme, isDark, toggleDark } = useTheme();

    // Helper function to determine if it's a normal event (types 3, 4, 11, 13)
    const isNormalEvent = (eventType: number) => {
        return [3, 4, 11, 13].includes(eventType);
    };

    // Helper function to determine if it's a Type 5 event
    const isType5Event = (eventType: number) => {
        return eventType === 5;
    };

    // Lazy-load cache for Type 5 idol predictions. Refs let the
    // `requestIdolData` callback dedupe in-flight and cached fetches without
    // taking `idolPredictions` / `loadingIdols` as deps (which would cause
    // the callback identity to change every fetch and re-trigger effects).
    const idolDataRef = useRef<Map<number, IdolPredictionData>>(new Map());
    const inFlightRef = useRef<Set<number>>(new Set());

    const requestIdolData = useCallback(async (idolId: number) => {
        if (idolDataRef.current.has(idolId) || inFlightRef.current.has(idolId)) return;
        inFlightRef.current.add(idolId);
        setLoadingIdols(prev => new Set(prev).add(idolId));
        try {
            const data = await loadIdolPrediction(idolId, baseUrl, debugSuffix);
            if (data) {
                const next = new Map(idolDataRef.current);
                next.set(idolId, data);
                idolDataRef.current = next;
                setIdolPredictions(next);
            }
        } finally {
            inFlightRef.current.delete(idolId);
            setLoadingIdols(prev => {
                const next = new Set(prev);
                next.delete(idolId);
                return next;
            });
        }
    }, [baseUrl, debugSuffix]);

    useEffect(() => {
        const loadData = async () => {
            try {
                let eventInfoData: EventInfo;

                if (forceType5Demo) {
                    // Skip the live metadata fetch and synthesize an EventInfo so
                    // we render the Type 5 page using whatever predictions still
                    // sit at the unversioned paths.
                    const now = new Date();
                    eventInfoData = {
                        EventId: demoEventId,
                        EventType: 5,
                        InternalEventType: 5,
                        EventName: demoEventName,
                        // StartAt set far enough in the past that the 36-hour
                        // pre-event gate doesn't trigger.
                        StartAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        EndAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    };
                    setEventInfo(eventInfoData);
                } else {
                    // Load event info (CDN will cache for 24 hours based on Cache-Control header)
                    const eventInfoResponse = await fetch(`${baseUrl}/metadata/latest_event_border_info.json${debugSuffix}`);
                    if (!eventInfoResponse.ok) {
                        throw new Error(`Failed to fetch event info: ${eventInfoResponse.status} ${eventInfoResponse.statusText}`);
                    }
                    eventInfoData = await eventInfoResponse.json();
                    setEventInfo(eventInfoData);
                }

                // Helper function to check if prediction data is valid (newer than event start)
                const validatePredictionData = async (url: string, eventStartTime: string): Promise<boolean> => {
                    try {
                        const response = await fetch(url, { method: 'HEAD' });
                        if (!response.ok) return false;
                        
                        const lastModified = response.headers.get('Last-Modified');
                        if (!lastModified) return true; // If no Last-Modified header, assume valid
                        
                        const predictionModifiedTime = new Date(lastModified);
                        const eventStart = new Date(eventStartTime);
                        
                        if (predictionModifiedTime < eventStart) {
                            console.error(`Prediction data is outdated. Event started at ${eventStart.toISOString()}, but predictions were last modified at ${predictionModifiedTime.toISOString()}`);
                            return false;
                        }
                        
                        return true;
                    } catch (error) {
                        console.error('Error checking prediction data validity:', error);
                        return false;
                    }
                };

                if (isNormalEvent(eventInfoData.EventType)) {
                    // Check if prediction data is valid before loading
                    const pred100Url = `${baseUrl}/prediction/0/100.0/predictions.json${debugSuffix}`;
                    const pred2500Url = `${baseUrl}/prediction/0/2500.0/predictions.json${debugSuffix}`;
                    
                    const [is100Valid, is2500Valid] = await Promise.all([
                        validatePredictionData(pred100Url, eventInfoData.StartAt),
                        validatePredictionData(pred2500Url, eventInfoData.StartAt)
                    ]);

                    // Use the original variables for production, or switch to test variables for testing
                    const finalIs100Valid = is100Valid; // Change right value to false for testing
                    const finalIs2500Valid = is2500Valid; // Change to testIs2500Valid for testing
                    
                    if (!finalIs100Valid || !finalIs2500Valid) {
                        console.error('Prediction data is outdated, showing no-event page');
                        setPredictionDataValid(false);
                        setLoading(false);
                        return;
                    }
                    
                    // Load normal event predictions (idol 0) - CDN will cache for 1 hour
                    const pred100Response = await fetch(pred100Url);
                    const pred2500Response = await fetch(pred2500Url);
                    
                    if (pred100Response.ok && pred2500Response.ok) {
                        setPrediction100(await pred100Response.json());
                        setPrediction2500(await pred2500Response.json());
                    } else {
                        console.warn('Failed to load normal event predictions');
                    }
                } else if (isType5Event(eventInfoData.EventType)) {
                    // Check a sample prediction file to validate data freshness.
                    // Skipped in demo mode because the historical data on R2 is
                    // older than the synthesized `StartAt`.
                    if (!forceType5Demo) {
                        const samplePredictionUrl = `${baseUrl}/prediction/1/100.0/predictions.json${debugSuffix}`;
                        const isValid = await validatePredictionData(samplePredictionUrl, eventInfoData.StartAt);

                        if (!isValid) {
                            console.error('Type 5 prediction data is outdated, showing no-event page');
                            setPredictionDataValid(false);
                            setLoading(false);
                            return;
                        }
                    }

                    // Lazy load: discover availability via HEAD probes, then
                    // let the page fetch each idol's full data on demand
                    // when selected. See `src/utils/type5Loader.ts`.
                    const availableIdols = await discoverAvailableIdols(baseUrl, debugSuffix);
                    setAvailableIdols(availableIdols);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        // Initial load
        loadData();
    }, []); // Only run once on mount

    // Wrapper functions to save state to localStorage
    const handleActiveTabChange = (tab: string) => {
        setActiveTab(tab);
        localStorage.setItem('activeTab', tab);
    };

    // Check maintenance mode first
    if (isMaintenanceMode) {
        return <MaintenancePage endTime={maintenanceEndTime} />;
    }

    // Preview mode: `?preview=modal` forces the no-event / data-invalid
    // screen, `?preview=pre-event` forces the 36-hour pre-event screen.
    // Useful for styling these pages during an active event where we can't
    // otherwise hit them. Remove the query param from the URL to go back.
    const previewScreen = new URLSearchParams(window.location.search).get('preview');
    if (previewScreen === 'modal') {
        return <EventModal />;
    }
    if (previewScreen === 'pre-event') {
        return (
            <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center">
                <div className="bg-base-200 rounded-lg shadow-lg p-8 max-w-md text-center">
                    <h2 className="text-xl font-bold mb-4">予測データ準備中</h2>
                    <p className="mb-2">イベント開始から36時間分のデータが必要です。</p>
                    <p className="text-base-content/70">恐れ入りますが、イベント開始から36時間経過後にご利用ください。</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div>Loading... (｀・ω・´)</div>;
    }

    if (!eventInfo || !isEventOngoing(eventInfo.StartAt, eventInfo.EndAt)) {
        return <EventModal />;
    }

    // Show a page in the first 36 hours of an event
    const eventStart = new Date(eventInfo.StartAt);
    const nowTime = new Date();
    const hoursSinceStart = (nowTime.getTime() - eventStart.getTime()) / (1000 * 60 * 60);
    if (!isDebug && hoursSinceStart < 36) {
        return (
            <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center">
                <div className="bg-base-200 rounded-lg shadow-lg p-8 max-w-md text-center">
                    <h2 className="text-xl font-bold mb-4">予測データ準備中</h2>
                    <p className="mb-2">イベント開始から36時間分のデータが必要です。</p>
                    <p className="text-base-content/70">恐れ入りますが、イベント開始から36時間経過後にご利用ください。</p>
                </div>
            </div>
        );
    }

    if (!predictionDataValid) {
        return <EventModal />;
    }

    // Render Type 5 event page
    if (isType5Event(eventInfo.EventType)) {
        return (
            <div className="min-h-screen">
                <Type5EventPage
                    eventInfo={eventInfo}
                    idolPredictions={idolPredictions}
                    availableIdols={availableIdols}
                    loadingIdols={loadingIdols}
                    requestIdolData={requestIdolData}
                    loading={loading}
                    theme={theme}
                    isDark={isDark}
                    toggleDark={toggleDark}
                />
            </div>
        );
    }

    // Render normal event page
    return (
        <div className="min-h-screen">
            <Banner isDark={isDark} toggleDark={toggleDark} />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 pb-4 border-b border-base-300">
                    <h1 className="text-xl sm:text-2xl font-bold">
                        ミリシタ・ボーダー予想
                    </h1>
                    <p className="text-base sm:text-lg text-base-content/70 break-words mt-1">
                        {eventInfo?.EventName}
                    </p>
                </div>

                {prediction100 && prediction2500 && eventInfo && (
                    <BorderTabs
                        prediction100={prediction100}
                        prediction2500={prediction2500}
                        startAt={eventInfo.StartAt}
                        activeTab={activeTab}
                        setActiveTab={handleActiveTabChange}
                        theme={theme}
                    />
                )}

                <CardContainer>
                    <FAQ />
                </CardContainer>

                <UpdatesButton />
            </div>
        </div>
    );
};

export default App;
