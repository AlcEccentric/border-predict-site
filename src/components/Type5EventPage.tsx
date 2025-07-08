import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardContainer from './CardContainer';
import IdolSelector from './IdolSelector';
import Type5MainChart from './Type5MainChart';
import Type5NeighborSection from './Type5NeighborSection';
import ThemeSelector from './ThemeSelector';
import FAQ from './FAQ';
import { IdolPredictionData, EventInfo } from '../types';
import { getIdolName } from '../utils/idolData';
import { Info } from 'lucide-react';

interface Type5EventPageProps {
    eventInfo: EventInfo;
    idolPredictions: Map<number, IdolPredictionData>;
    loading: boolean;
    theme: string;
    setTheme: (theme: string) => void;
}

const Type5EventPage: React.FC<Type5EventPageProps> = ({
    eventInfo,
    idolPredictions,
    loading,
    theme,
    setTheme
}) => {
    const [selectedIdol, setSelectedIdol] = useState<number>(1); // Default selection
    const [showNeighbors, setShowNeighbors] = useState<boolean>(false); // Ensure boolean type for controlled input
    const chartSectionRef = useRef<HTMLDivElement>(null);
    const neighborSectionRef = useRef<HTMLDivElement>(null);

    const handleIdolSelect = (idolId: number) => {
        setSelectedIdol(idolId);
        
        // Scroll to chart section after a short delay to allow for state update
        setTimeout(() => {
            chartSectionRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };

    const handleNeighborToggle = () => {
        const newShowNeighbors = !showNeighbors;
        setShowNeighbors(newShowNeighbors);
        
        // If turning on, scroll to neighbor section after animation
        if (newShowNeighbors) {
            setTimeout(() => {
                neighborSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center' // Use 'center' instead of 'start' to keep toggle visible
                });
            }, 200); // Reduced delay since animation is now smoother
        }
    };

    const getScoreForIdol = (idolId: number, border: '100' | '1000') => {
        const idolData = idolPredictions.get(idolId);
        if (!idolData) return null;
        
        const prediction = border === '100' ? idolData.prediction100 : idolData.prediction1000;
        if (!prediction) return null;
        
        const scores = prediction.data.raw.target;
        return scores[scores.length - 1];
    };

    const hasDataForBorder = (idolId: number, border: '100' | '1000') => {
        const idolData = idolPredictions.get(idolId);
        if (!idolData) return false;
        return border === '100' ? !!idolData.prediction100 : !!idolData.prediction1000;
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg"></div>
                    <p className="mt-4">データを読み込み中... (｀・ω・´)</p>
                </div>
            </div>
        );
    }

    const score100 = getScoreForIdol(selectedIdol, '100');
    const score1000 = getScoreForIdol(selectedIdol, '1000');

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <CardContainer className="mb-8">
                <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                        <h1 className="text-3xl font-bold">
                            ミリシタ・ボーダー予想
                        </h1>
                        <h2 className="text-2xl font-bold mt-2">
                            {eventInfo.EventName}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeSelector theme={theme} setTheme={setTheme} />
                    </div>
                </div>
            </CardContainer>

            {/* Idol Selector */}
            <IdolSelector
                selectedIdol={selectedIdol}
                onIdolSelect={handleIdolSelect}
                availableIdols={new Set(Array.from(idolPredictions.keys()).filter(idolId => {
                    const idolData = idolPredictions.get(idolId);
                    return idolData && (idolData.prediction100 || idolData.prediction1000);
                }))}
            />

            {selectedIdol && idolPredictions.has(selectedIdol) && (
                <>
                    {/* Summary Stats */}
                    <CardContainer className="mb-8">
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold">{getIdolName(selectedIdol)}の予測スコア</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 100 Border Stats */}
                            <div className="text-center space-y-3">
                                <h3 className="text-xl text-primary font-bold">100位ボーダー</h3>
                                {hasDataForBorder(selectedIdol, '100') ? (
                                    <div className="stats stats-vertical shadow">
                                        <div className="stat">
                                            <div className="stat-title font-bold text-primary">予測スコア</div>
                                            <div className="stat-value text-primary">
                                                {Math.round(score100!).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="stat">
                                            <div className="stat-title font-bold text-primary">±5% 誤差区間</div>
                                            <div className="stat-desc font-bold text-primary">
                                                {Math.round(score100! * 0.95).toLocaleString()} ～ {Math.round(score100! * 1.05).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="stat">
                                            <div className="stat-title font-bold text-primary">±10% 誤差区間</div>
                                            <div className="stat-desc font-bold text-primary">
                                                {Math.round(score100! * 0.9).toLocaleString()} ～ {Math.round(score100! * 1.1).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="stats stats-vertical shadow">
                                        <div className="stat">
                                            <div className="stat-title font-bold text-error">データ不足</div>
                                            <div className="stat-value text-error text-lg">
                                                予測不可
                                            </div>
                                            <div className="stat-desc text-error">
                                                十分な過去データがありません
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 1000 Border Stats */}
                            <div className="text-center space-y-3">
                                <h3 className="text-xl font-bold text-secondary">1000位ボーダー</h3>
                                {hasDataForBorder(selectedIdol, '1000') ? (
                                    <div className="stats stats-vertical shadow">
                                        <div className="stat">
                                            <div className="stat-title font-bold text-secondary">予測スコア</div>
                                            <div className="stat-value text-secondary">
                                                {Math.round(score1000!).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="stat">
                                            <div className="stat-title font-bold text-secondary">±5% 誤差区間</div>
                                            <div className="stat-desc font-bold text-secondary">
                                                {Math.round(score1000! * 0.95).toLocaleString()} ～ {Math.round(score1000! * 1.05).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="stat">
                                            <div className="stat-title font-bold text-secondary">±10% 誤差区間</div>
                                            <div className="stat-desc font-bold text-secondary">
                                                {Math.round(score1000! * 0.9).toLocaleString()} ～ {Math.round(score1000! * 1.1).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="stats stats-vertical shadow">
                                        <div className="stat">
                                            <div className="stat-title font-bold text-error">データ不足</div>
                                            <div className="stat-value text-error text-lg">
                                                予測不可
                                            </div>
                                            <div className="stat-desc text-error">
                                                十分な過去データがありません
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContainer>

                    {/* Main Chart Section */}
                    <div ref={chartSectionRef}>
                        <CardContainer className="mb-4">
                            <div className="space-y-4">
                                {/* Main Chart */}
                                <div className="relative w-full">
                                    <AnimatePresence mode="popLayout">
                                        <motion.div
                                            layout
                                            transition={{ type: "spring", stiffness: 100, damping: 20, duration: 0.5 }}
                                            className="w-full"
                                        >
                                            <Type5MainChart
                                                idolPredictions={idolPredictions}
                                                selectedIdol={selectedIdol}
                                                startAt={eventInfo.StartAt}
                                                eventName={eventInfo.EventName}
                                                theme={theme}
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </CardContainer>
                        
                        {/* Neighbors Toggle */}
                        <div className="flex justify-end mb-4">
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
                                    checked={!!showNeighbors} // Ensure boolean value
                                    onChange={handleNeighborToggle}
                                    disabled={!hasDataForBorder(selectedIdol, '100') && !hasDataForBorder(selectedIdol, '1000')}
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
                                        <Type5NeighborSection
                                            idolPredictions={idolPredictions}
                                            selectedIdol={selectedIdol}
                                            theme={theme}
                                            eventName={eventInfo.EventName}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </>
            )}

            {!selectedIdol && (
                <CardContainer>
                    <div className="text-center py-12">
                        <p className="text-lg text-base-content/70">
                            表示するアイドルを選択してください
                        </p>
                    </div>
                </CardContainer>
            )}

            {/* FAQ Section - Independent component at the bottom */}
            <CardContainer>
                <FAQ />
            </CardContainer>
        </div>
    );
};

export default Type5EventPage;
