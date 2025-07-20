import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainChart from './MainChart';
import { PredictionData } from '../types';
import CardContainer from './CardContainer';
import NeighborSection from './NeighborSection';
import { Info } from 'lucide-react';

interface BorderTabsProps {
    prediction100: PredictionData;
    prediction2500: PredictionData;
    showNeighbors: boolean;
    toggleNeighbors: () => void;
    startAt: string;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    theme: string;
}

const BorderTabs: React.FC<BorderTabsProps> = ({
    prediction100,
    prediction2500,
    showNeighbors,
    toggleNeighbors,
    startAt,
    activeTab,
    setActiveTab,
    theme
}) => {
    const neighborSectionRef = useRef<HTMLDivElement>(null);

    const getFinalScore = (prediction: PredictionData) => {
        const scores = prediction.data.raw.target;
        return scores[scores.length - 1];
    };
    const finalScore = getFinalScore(activeTab === '100' ? prediction100 : prediction2500);

    const handleNeighborToggle = () => {
        toggleNeighbors();
        
        // If turning on, scroll to neighbor section after animation
        if (!showNeighbors) {
            setTimeout(() => {
                neighborSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 200);
        }
    };

    return (
        <CardContainer className="mb-8">
            <div className="flex flex-col gap-4">
                {/* Tabs */}
                <div className="tabs tabs-boxed w-full">
                    <a 
                        className={`tab flex-1 ${
                            activeTab === '100'
                                ? 'tab-active border-b-4 border-primary font-bold'
                                : ''
                        }`}
                        onClick={() => setActiveTab('100')}
                    >
                        100位
                    </a>
                    <a 
                        className={`tab flex-1 ${
                            activeTab === '2500'
                                ? 'tab-active border-b-4 border-primary font-bold'
                                : ''
                        }`}
                        onClick={() => setActiveTab('2500')}
                    >
                        2500位
                    </a>
                </div>

                <div className="text-center space-y-2">
                    {/* Final Score */}
                    <h3 className="text-lg sm:text-2xl font-bold flex items-center justify-center gap-2 flex-wrap">
                        <span>{activeTab}位の予想最終スコア: {finalScore.toLocaleString()}</span>
                        <div className="tooltip" data-tip="予測精度について詳しく見る">
                            <button 
                                className="btn btn-xs btn-outline btn-primary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const element = document.getElementById('prediction-accuracy');
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                            >
                                <Info className="w-3 h-3" />
                                精度
                            </button>
                        </div>
                    </h3>

                    {/* ±5% Range */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2 text-sm">
                        <span className="text-center">±5% 誤差区間: {Math.round(finalScore * 0.95).toLocaleString()} ～ {Math.round(finalScore * 1.05).toLocaleString()}</span>
                    </div>

                    {/* ±10% Range */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2 text-sm">
                        <span className="text-center">±10% 誤差区間: {Math.round(finalScore * 0.9).toLocaleString()} ～ {Math.round(finalScore * 1.1).toLocaleString()}</span>
                    </div>
                </div>

                {/* Main Chart */}
                <div className="relative w-full">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            layout
                            transition={{ type: "spring", stiffness: 100, damping: 20, duration: 0.5 }}
                            className="w-full"
                        >
                            <MainChart
                                data={activeTab === '100' ? prediction100 : prediction2500}
                                startAt={startAt}
                                theme={theme}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Neighbors Toggle */}
                <div className="flex justify-center sm:justify-end">
                    <label className="cursor-pointer label gap-2 flex-wrap justify-center sm:justify-end">
                        <div className="flex items-center gap-2">
                            <span className="label-text text-center sm:text-left">近傍(類似)イベント表示</span>
                            <div
                                className="tooltip"
                                data-tip="近傍イベントは現在のイベントと傾向が似ているイベントです。詳細はページ下部の「解説」内「近傍イベントとは」をご覧ください"
                            >
                                <span className="cursor-pointer text-info">
                                    <Info className="w-4 h-4 text-info cursor-pointer" />
                                </span>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={showNeighbors}
                            onChange={handleNeighborToggle}
                        />
                    </label>
                </div>

                {/* Neighbor Section */}
                <div className="relative w-full">
                    <AnimatePresence>
                        {showNeighbors && (
                            <motion.div
                                key="neighbors"
                                ref={neighborSectionRef}
                                initial={{ opacity: 0, height: 0, y: -20 }}
                                animate={{ opacity: 1, height: "auto", y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -20 }}
                                transition={{ 
                                    type: "spring", 
                                    stiffness: 300, 
                                    damping: 30,
                                    height: { duration: 0.4 },
                                    opacity: { duration: 0.3 }
                                }}
                                className="w-full overflow-hidden"
                            >
                                <NeighborSection
                                    normalizedData={activeTab === '100' 
                                        ? prediction100.data.normalized 
                                        : prediction2500.data.normalized}
                                    lastKnownIndex={activeTab === '100'
                                        ? prediction100.metadata.normalized.last_known_step_index
                                        : prediction2500.metadata.normalized.last_known_step_index}
                                    neighborMetadata={activeTab === '100'
                                        ? prediction100.metadata.normalized.neighbors
                                        : prediction2500.metadata.normalized.neighbors}
                                    currentEventMetadata={{
                                        name: activeTab === '100' ? prediction100.metadata.raw.name : prediction2500.metadata.raw.name,
                                        id: activeTab === '100' ? prediction100.metadata.raw.id : prediction2500.metadata.raw.id,
                                        length: activeTab === '100' 
                                            ? prediction100.data.raw.target.length 
                                            : prediction2500.data.raw.target.length
                                    }}
                                    theme={theme}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </CardContainer>
    );
};

export default BorderTabs;