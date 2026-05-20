import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainChart from './MainChart';
import { PredictionData } from '../types';
import CardContainer from './CardContainer';
import { Info } from 'lucide-react';

interface BorderTabsProps {
    prediction100: PredictionData;
    prediction2500: PredictionData;
    startAt: string;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    theme: string;
}

const BorderTabs: React.FC<BorderTabsProps> = ({
    prediction100,
    prediction2500,
    startAt,
    activeTab,
    setActiveTab,
    theme
}) => {
    const getFinalScore = (prediction: PredictionData) => {
        const scores = prediction.data.raw.target;
        return scores[scores.length - 1];
    };
    const finalScore = getFinalScore(activeTab === '100' ? prediction100 : prediction2500);

    return (
        <CardContainer className="mb-4">
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

                    {/* Error Ranges Bubble - subtle style */}
                    <div className="inline-block rounded-lg bg-base-100 border border-base-300 px-3 py-2 text-base-content font-normal shadow-sm mt-2">
                        <div className="flex flex-col gap-1 items-center">
                            <div className="text-sm sm:text-base">
                                <span className="mr-2 text-base-content/70">90%信頼区間:</span>
                                <span>
                                    {(() => {
                                        const prediction = activeTab === '100' ? prediction100 : prediction2500;
                                        const bounds = prediction.data.raw.bounds;
                                        if (bounds && bounds[90]) {
                                            return `${Math.round(bounds[90].lower.slice(-1)[0]).toLocaleString()} ～ ${Math.round(bounds[90].upper.slice(-1)[0]).toLocaleString()}`;
                                        }
                                        return `${Math.round(finalScore * 0.95).toLocaleString()} ～ ${Math.round(finalScore * 1.05).toLocaleString()}`;
                                    })()}
                                </span>
                            </div>
                            <div className="text-sm sm:text-base">
                                <span className="mr-2 text-base-content/70">75%信頼区間:</span>
                                <span>
                                    {(() => {
                                        const prediction = activeTab === '100' ? prediction100 : prediction2500;
                                        const bounds = prediction.data.raw.bounds;
                                        if (bounds && bounds[75]) {
                                            return `${Math.round(bounds[75].lower.slice(-1)[0]).toLocaleString()} ～ ${Math.round(bounds[75].upper.slice(-1)[0]).toLocaleString()}`;
                                        }
                                        return `${Math.round(finalScore * 0.9).toLocaleString()} ～ ${Math.round(finalScore * 1.1).toLocaleString()}`;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Chart */}
                <div className="relative w-full">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            layout
                            transition={{ type: 'spring', stiffness: 100, damping: 20, duration: 0.5 }}
                            className="w-full"
                        >
                            <MainChart
                                key={activeTab}
                                data={activeTab === '100' ? prediction100 : prediction2500}
                                startAt={startAt}
                                theme={theme}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </CardContainer>
    );
};

export default BorderTabs;
