import React from 'react';
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
}

const BorderTabs: React.FC<BorderTabsProps> = ({
    prediction100,
    prediction2500,
    showNeighbors,
    toggleNeighbors,
    startAt,
    activeTab,
    setActiveTab
}) => {

    const getFinalScore = (prediction: PredictionData) => {
        const scores = prediction.data.raw.target;
        return scores[scores.length - 1];
    };
    const finalScore = getFinalScore(activeTab === '100' ? prediction100 : prediction2500);

    const getSLAInfo = (prediction: PredictionData, errorRange: number) => {
        return prediction.metadata.raw.sla[errorRange];
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
                    <h3 className="text-2xl font-bold">
                        {activeTab}位の予想最終スコア: {finalScore.toLocaleString()}
                    </h3>

                    {/* ±5% Range */}
                    <div className="flex justify-center items-center gap-2 text-sm">
                        <span>±5% 誤差区間: {Math.round(finalScore * 0.95).toLocaleString()} ～ {Math.round(finalScore * 1.05).toLocaleString()}</span>
                        <div className="tooltip" data-tip={getSLAInfo(activeTab === '100' ? prediction100 : prediction2500, 5)}>
                            <span className="cursor-pointer text-info">
                                <Info className="w-4 h-4 text-info cursor-pointer" />
                            </span>
                        </div>
                    </div>

                    {/* ±10% Range */}
                    <div className="flex justify-center items-center gap-2 text-sm">
                        <span>±10% 誤差区間: {Math.round(finalScore * 0.9).toLocaleString()} ～ {Math.round(finalScore * 1.1).toLocaleString()}</span>
                        <div className="tooltip" data-tip={getSLAInfo(activeTab === '100' ? prediction100 : prediction2500, 10)}>
                            <span className="cursor-pointer text-info">
                                <Info className="w-4 h-4 text-info cursor-pointer" />
                            </span>
                        </div>
                    </div>
                </div>
                

                {/* Neighbors Toggle */}
                <div className="flex justify-end">
                    <label className="cursor-pointer label gap-2">
                        <span className="label-text">近傍イベント表示</span>
                        <div
                            className="tooltip"
                            data-tip="近傍イベントは現在のイベントと傾向が似ているイベントです。詳細はページ下部の「解説」内「近傍イベントとは」をご覧ください"
                        >
                            <span className="cursor-pointer text-info">
                                <Info className="w-4 h-4 text-info cursor-pointer" />
                            </span>
                        </div>
                        <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={showNeighbors}
                            onChange={toggleNeighbors}
                        />
                    </label>
                </div>

                {/* Charts */}
                <div className="relative w-full">
                    <AnimatePresence mode="popLayout">
                        {showNeighbors && (
                            <motion.div
                                key="neighbors"
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 100 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="mb-6 w-full"
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
                                    currentEventMetadata={activeTab === '100'
                                        ? prediction100.metadata.raw.basic
                                        : prediction2500.metadata.raw.basic}
                                />
                            </motion.div>
                        )}

                        <motion.div
                            layout
                            transition={{ type: "spring", stiffness: 100, damping: 20, duration: 0.5 }}
                            className="w-full"
                        >
                            <MainChart
                                data={activeTab === '100' ? prediction100 : prediction2500}
                                startAt={startAt}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </CardContainer>
    );
};

export default BorderTabs;