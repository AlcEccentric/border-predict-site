import React, { useEffect, useState } from 'react';
import EventModal from './components/EventModal';
import { EventInfo, PredictionData } from './types';
import { isEventOngoing } from './utils/dateUtils';
import BorderTabs from './components/BorderTabs';
import FAQ from './components/FAQ';
import CardContainer from './components/CardContainer';
import ThemeSelector from './components/ThemeSelector';

const App: React.FC = () => {
    const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
    const [prediction100, setPrediction100] = useState<PredictionData | null>(null);
    const [prediction2500, setPrediction2500] = useState<PredictionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('100');
    const [showNeighbors, setShowNeighbors] = useState(false);
    const themes = ['nord', 'cupcake', 'dim', 'aqua', 'sunset'];
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || themes[0]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || themes[0];
        document.documentElement.setAttribute('data-theme', savedTheme);
        const loadData = async () => {
            try {
                // Load event info
                const eventInfoResponse = await fetch('/metadata/latest_event_border_info.json');
                const eventInfoData = await eventInfoResponse.json();
                setEventInfo(eventInfoData);

                // Load predictions
                const pred100Response = await fetch('/prediction/100/predictions.json');
                const pred2500Response = await fetch('/prediction/2500/predictions.json');
                
                setPrediction100(await pred100Response.json());
                setPrediction2500(await pred2500Response.json());
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [theme]);

    if (loading) {
        return <div>Loading... (｀・ω・´)</div>;
    }

    if (!eventInfo || !isEventOngoing(eventInfo.StartAt, eventInfo.EndAt)) {
        return <EventModal />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <CardContainer className="mb-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold flex flex-col gap-2">
                        <span>ミリシタ・ボーダー予想</span>
                        <span className="text-2xl text-gray-500">{eventInfo?.Name}</span>
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