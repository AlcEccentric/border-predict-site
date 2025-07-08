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
    const releaseDate = new Date('2025-06-01T00:00:00+09:00'); // TODO: update once development is complete
    const now = new Date();
    if (now < releaseDate) { 
        return <EventModal />;
    }
    const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
    const [prediction100, setPrediction100] = useState<PredictionData | null>(null);
    const [prediction2500, setPrediction2500] = useState<PredictionData | null>(null);
    const [idolPredictions, setIdolPredictions] = useState<Map<number, IdolPredictionData>>(new Map());
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('100');
    const [showNeighbors, setShowNeighbors] = useState(false);
    const themes = ['nord', 'cupcake', 'dim', 'aqua', 'sunset'];
    // Configuration for data source - set to local for development, remote for production
    const baseUrl = 'https://cdn.yuenimillion.live'; // Production URL
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
                // Load event info
                const eventInfoResponse = await fetch(`${baseUrl}/metadata/latest_event_border_info.json`);
                if (!eventInfoResponse.ok) {
                    throw new Error(`Failed to fetch event info: ${eventInfoResponse.status} ${eventInfoResponse.statusText}`);
                }
                const eventInfoData = await eventInfoResponse.json();
                setEventInfo(eventInfoData);

                if (isNormalEvent(eventInfoData.EventType)) {
                    // Load normal event predictions (idol 0)
                    const pred100Response = await fetch(`${baseUrl}/prediction/0/100.0/predictions.json`);
                    const pred2500Response = await fetch(`${baseUrl}/prediction/0/2500.0/predictions.json`);
                    
                    if (pred100Response.ok && pred2500Response.ok) {
                        setPrediction100(await pred100Response.json());
                        setPrediction2500(await pred2500Response.json());
                    } else {
                        console.warn('Failed to load normal event predictions');
                    }
                } else if (isType5Event(eventInfoData.EventType)) {
                    // Load Type 5 event predictions for all idols
                    const idolPredictionsMap = new Map<number, IdolPredictionData>();
                    
                    // Load predictions for idols 1-52
                    const loadPromises = [];
                    for (let idolId = 1; idolId <= 52; idolId++) {
                        loadPromises.push(
                            Promise.allSettled([
                                fetch(`${baseUrl}/prediction/${idolId}/100.0/predictions.json`).then(res => {
                                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                    return res.json();
                                }),
                                fetch(`${baseUrl}/prediction/${idolId}/1000.0/predictions.json`).then(res => {
                                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                    return res.json();
                                })
                            ]).then((results) => {
                                const [pred100Result, pred1000Result] = results;
                                
                                // Extract successful predictions or null for failed ones
                                const pred100 = pred100Result.status === 'fulfilled' ? pred100Result.value : null;
                                const pred1000 = pred1000Result.status === 'fulfilled' ? pred1000Result.value : null;
                                
                                // Only add to map if at least one prediction exists
                                if (pred100 || pred1000) {
                                    idolPredictionsMap.set(idolId, {
                                        idolId,
                                        prediction100: pred100,
                                        prediction1000: pred1000
                                    });
                                }
                                
                                // Log what data we have for debugging
                                const available = [];
                                if (pred100) available.push('100');
                                if (pred1000) available.push('1000');
                                
                            }).catch(error => {
                                console.warn(`Failed to load predictions for idol ${idolId}:`, error);
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

        loadData();
    }, []); // Only run once on mount

    // Separate effect for theme changes
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    if (loading) {
        return <div>Loading... (｀・ω・´)</div>;
    }

    if (!eventInfo || !isEventOngoing(eventInfo.StartAt, eventInfo.EndAt)) {
        return <EventModal />;
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
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold flex flex-col gap-2">
                        <span>ミリシタ・ボーダー予想</span>
                        <span className="text-2xl text-gray-500">{eventInfo?.EventName}</span>
                    </h1>
                    <div className="flex items-center gap-2">
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
                        toggleNeighbors={() => setShowNeighbors(!showNeighbors)}
                        startAt={eventInfo.StartAt}
                        activeTab={activeTab} 
                        setActiveTab={setActiveTab} 
                        theme={theme}
                    />
                </>
            )}

            <CardContainer>
                <FAQ />
            </CardContainer>
        </div>
    );
};

export default App;