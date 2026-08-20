import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainChart from './MainChart';
import { PredictionData, getFinalCI, getFinalBoundValue } from '../types';
import CardContainer from './CardContainer';
import LastUpdated from './LastUpdated';
import { safetyColor } from '../utils/safety';

interface BorderTabsProps {
    prediction100: PredictionData;
    prediction2500: PredictionData;
    startAt: string;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    theme: string;
    lastUpdated: Date | null;
}

const BorderTabs: React.FC<BorderTabsProps> = ({
    prediction100,
    prediction2500,
    startAt,
    activeTab,
    setActiveTab,
    theme,
    lastUpdated,
}) => {
    const getFinalScore = (prediction: PredictionData) => {
        const scores = prediction.data.raw.target;
        return scores[scores.length - 1];
    };
    // Final-time safety-line targets (P70..P90) for the active border, or null
    // when the prediction carries no safety ladder (old CIs) -> CI fallback.
    const getSafetyLadder = (prediction: PredictionData) => {
        const s = prediction.data.raw.safety;
        if (!s || !Array.isArray(s.levels) || s.levels.length === 0) return null;
        const rows = s.levels
            .map((lvl) => ({ level: lvl, value: getFinalBoundValue(s[String(lvl)] as number | number[]) }))
            .filter((r): r is { level: number; value: number } => r.value !== undefined);
        return rows.length ? rows : null;
    };
    const finalScore = getFinalScore(activeTab === '100' ? prediction100 : prediction2500);
    const safetyLadder = getSafetyLadder(activeTab === '100' ? prediction100 : prediction2500);

    // Selected safety level (single control shared by the hero readout, the
    // pill selector, and the chart's highlighted line). Default P80; reset to
    // the middle level whenever the active border's ladder changes shape.
    const [selectedLevel, setSelectedLevel] = useState<number>(80);
    useEffect(() => {
        if (safetyLadder && !safetyLadder.some((r) => r.level === selectedLevel)) {
            setSelectedLevel(safetyLadder[Math.floor(safetyLadder.length / 2)].level);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safetyLadder?.map((r) => r.level).join(',')]);

    const selectedRow = safetyLadder?.find((r) => r.level === selectedLevel);

    return (
        <CardContainer className="mb-4">
            <div className="flex justify-end mb-1">
                <LastUpdated timestamp={lastUpdated} />
            </div>
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
                    {/* Point forecast: always shown, independent of the safety selector below */}
                    <h3 className="text-lg sm:text-2xl font-bold flex items-center justify-center gap-2 flex-wrap">
                        <span>{activeTab}位の予想最終スコア: {finalScore.toLocaleString()}</span>
                    </h3>

                    {safetyLadder ? (
                        <div className="inline-flex flex-col items-center gap-1.5 rounded-xl bg-base-100 border border-base-300 px-4 py-3 shadow-sm">
                            {/* Pill selector: one control for hero number + chart highlight */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-base-content/60 mr-1">安全圏に入る確率</span>
                                {safetyLadder.map((r) => {
                                    const sel = r.level === selectedLevel;
                                    return (
                                        <button
                                            key={r.level}
                                            onClick={() => setSelectedLevel(r.level)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${sel ? 'text-base-100' : ''}`}
                                            style={{
                                                backgroundColor: sel ? safetyColor(r.level, theme) : 'transparent',
                                                color: sel ? undefined : safetyColor(r.level, theme),
                                                border: `1px solid ${safetyColor(r.level, theme)}`,
                                            }}
                                        >
                                            {r.level}%
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Hero number: the one target that matters at the selected level */}
                            {selectedRow && (
                                <div className="text-lg sm:text-2xl font-bold">
                                    <span className="font-mono" style={{ color: safetyColor(selectedRow.level, theme) }}>
                                        {Math.round(selectedRow.value).toLocaleString()}
                                    </span>
                                    <span className="text-base-content/80 text-sm sm:text-base font-normal">
                                        {' '}以上なら約{selectedRow.level}%の確率で安全圏
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="inline-block rounded-lg bg-base-100 border border-base-300 px-3 py-2 text-base-content font-normal shadow-sm mt-2">
                            <div className="flex flex-col gap-1 items-center">
                                <div className="text-sm sm:text-base">
                                    <span className="mr-2 text-base-content/70">90%信頼区間:</span>
                                    <span>
                                        {(() => {
                                            const prediction = activeTab === '100' ? prediction100 : prediction2500;
                                            const ci = getFinalCI(prediction.data.raw.bounds?.[90]);
                                            if (ci) {
                                                return `${Math.round(ci.lower).toLocaleString()} ～ ${Math.round(ci.upper).toLocaleString()}`;
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
                                            const ci = getFinalCI(prediction.data.raw.bounds?.[75]);
                                            if (ci) {
                                                return `${Math.round(ci.lower).toLocaleString()} ～ ${Math.round(ci.upper).toLocaleString()}`;
                                            }
                                            return `${Math.round(finalScore * 0.9).toLocaleString()} ～ ${Math.round(finalScore * 1.1).toLocaleString()}`;
                                        })()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
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
                                selectedLevel={selectedLevel}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </CardContainer>
    );
};

export default BorderTabs;
