import React, { useEffect, useState } from 'react';
import EventModal from './components/EventModal';
import { EventInfo, PredictionData, IdolPredictionData } from './types';
import { isEventOngoing } from './utils/dateUtils';
import BorderTabs from './components/BorderTabs';
import Type5EventPage from './components/Type5EventPage';
import FAQ from './components/FAQ';
import CardContainer from './components/CardContainer';
import ThemeSelector from './components/ThemeSelector';

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
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(() => {
        const savedActiveTab = localStorage.getItem('activeTab');
        return savedActiveTab || '100';
    });
    const [showNeighbors, setShowNeighbors] = useState(() => {
        const savedShowNeighbors = localStorage.getItem('normalEventShowNeighbors');
        return savedShowNeighbors === 'true';
    });
    const themes = ['nord', 'cupcake', 'dim', 'aqua', 'sunset'];
    // Configuration for data source - set to local for development, remote for production
    const baseUrl = 'https://cdn.yuenimillion.live/data'; // Production URL
    const isDebug = false;
    const debugSuffix = isDebug ? '?debug' : '';
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme') || themes[1];
        // Set initial theme immediately
        document.documentElement.setAttribute('data-theme', savedTheme);
        return savedTheme;
    });

    // Helper function to determine if it's a normal event (types 3, 4, 11, 13)
    const isNormalEvent = (eventType: number) => {
        return [3, 4, 11, 13].includes(eventType);
    };

    // Helper function to determine if it's a Type 5 event
    const isType5Event = (eventType: number) => {
        return eventType === 5;
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load event info (CDN will cache for 24 hours based on Cache-Control header)
                const eventInfoResponse = await fetch(`${baseUrl}/metadata/latest_event_border_info.json${debugSuffix}`);
                if (!eventInfoResponse.ok) {
                    throw new Error(`Failed to fetch event info: ${eventInfoResponse.status} ${eventInfoResponse.statusText}`);
                }
                const eventInfoData = await eventInfoResponse.json();
                setEventInfo(eventInfoData);

                if (isNormalEvent(eventInfoData.EventType)) {
                    // Load normal event predictions (idol 0) - CDN will cache for 1 hour
                    const pred100Response = await fetch(`${baseUrl}/prediction/0/100.0/predictions.json${debugSuffix}`);
                    const pred2500Response = await fetch(`${baseUrl}/prediction/0/2500.0/predictions.json${debugSuffix}`);
                    
                    if (pred100Response.ok && pred2500Response.ok) {
                        setPrediction100(await pred100Response.json());
                        setPrediction2500(await pred2500Response.json());
                    } else {
                        console.warn('Failed to load normal event predictions');
                    }
                } else if (isType5Event(eventInfoData.EventType)) {
                    // Load Type 5 event predictions for all idols
                    const idolPredictionsMap = new Map<number, IdolPredictionData>();
                    
                    // Helper function to safely fetch prediction data
                    const fetchPrediction = async (idolId: number, border: string) => {
                        try {
                            const response = await fetch(`${baseUrl}/prediction/${idolId}/${border}/predictions.json${debugSuffix}`);
                            if (!response.ok) {
                                return null; // Return null for 404s and other errors
                            }
                            return await response.json();
                        } catch (error) {
                            // Silently handle network errors (CORS, 404, etc.)
                            return null;
                        }
                    };
                    
                    // Load predictions for idols 1-52
                    const loadPromises = [];
                    for (let idolId = 1; idolId <= 52; idolId++) {
                        loadPromises.push(
                            Promise.all([
                                fetchPrediction(idolId, '100.0'),
                                fetchPrediction(idolId, '1000.0')
                            ]).then(([pred100, pred1000]) => {
                                // Only add to map if at least one prediction exists
                                if (pred100 || pred1000) {
                                    idolPredictionsMap.set(idolId, {
                                        idolId,
                                        prediction100: pred100,
                                        prediction1000: pred1000
                                    });
                                    
                                    // Optional: Log successful loads (can be removed in production)
                                    // const available = [];
                                    // if (pred100) available.push('100');
                                    // if (pred1000) available.push('1000');
                                    // console.log(`Loaded predictions for idol ${idolId}: ${available.join(', ')}`);
                                }
                            }).catch(error => {
                                // This should rarely happen since we handle errors in fetchPrediction
                                console.warn(`Unexpected error loading predictions for idol ${idolId}:`, error);
                            })
                        );
                    }
                    
                    await Promise.all(loadPromises);
                    setIdolPredictions(idolPredictionsMap);
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

    // Separate effect for theme changes
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Wrapper functions to save state to localStorage
    const handleActiveTabChange = (tab: string) => {
        setActiveTab(tab);
        localStorage.setItem('activeTab', tab);
    };

    const handleNeighborsToggle = () => {
        const newShowNeighbors = !showNeighbors;
        setShowNeighbors(newShowNeighbors);
        localStorage.setItem('normalEventShowNeighbors', newShowNeighbors.toString());
    };

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
    if (hoursSinceStart < 36) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <div className="bg-base-200 rounded-lg shadow-lg p-8 max-w-md text-center">
                    <h2 className="text-xl font-bold mb-4">予測データ準備中</h2>
                    <p className="mb-2">イベント開始から36時間分のデータが必要です。</p>
                    <p className="text-base-content/70">申し訳ありませんが、予測はイベント開始から36時間経過後にご利用いただけます。</p>
                </div>
            </div>
        );
    }

    // Render Type 5 event page
    if (isType5Event(eventInfo.EventType)) {
        return (
            <div className="min-h-screen">
                <Type5EventPage
                    eventInfo={eventInfo}
                    idolPredictions={idolPredictions}
                    loading={loading}
                    theme={theme}
                    setTheme={setTheme}
                />
            </div>
        );
    }

    // Render normal event page
    return (
        <div className="container mx-auto px-4 py-8">
            <CardContainer className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex flex-col gap-2">
                        <span>ミリシタ・ボーダー予想 (ベータ版)</span>
                        <span className="text-xl sm:text-2xl text-gray-500 break-words">{eventInfo?.EventName}</span>
                    </h1>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <ThemeSelector theme={theme} setTheme={setTheme} />
                    </div>
                </div>
            </CardContainer>

            {prediction100 && prediction2500 && eventInfo && (
                <>
                    <BorderTabs
                        prediction100={prediction100}
                        prediction2500={prediction2500}
                        showNeighbors={showNeighbors}
                        toggleNeighbors={handleNeighborsToggle}
                        startAt={eventInfo.StartAt}
                        activeTab={activeTab} 
                        setActiveTab={handleActiveTabChange} 
                        theme={theme}
                    />
                </>
            )}

            <CardContainer>
                <FAQ eventType={eventInfo.EventType} internalEventType={eventInfo.InternalEventType} />
            </CardContainer>
        </div>
    );
};

export default App;
