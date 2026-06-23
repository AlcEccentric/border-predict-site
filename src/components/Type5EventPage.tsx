import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardContainer from './CardContainer';
import IdolSelector from './IdolSelector';
import Type5MainChart from './Type5MainChart';
import Banner from './Banner';
import UpdatesButton from './UpdatesButton';
import FAQ from './FAQ';
import { IdolPredictionData, EventInfo } from '../types';
import { getIdolName } from '../utils/idolData';
import { Info } from 'lucide-react';

interface Type5EventPageProps {
    eventInfo: EventInfo;
    idolPredictions: Map<number, IdolPredictionData>;
    availableIdols: Set<number>;
    loadingIdols: Set<number>;
    requestIdolData: (idolId: number) => void;
    loading: boolean;
    theme: string;
    isDark: boolean;
    toggleDark: () => void;
}

const Type5EventPage: React.FC<Type5EventPageProps> = ({
    eventInfo,
    idolPredictions,
    availableIdols,
    loadingIdols,
    requestIdolData,
    loading,
    theme,
    isDark,
    toggleDark
}) => {
    // Initialize selectedIdol from localStorage or default to 1
    const [selectedIdol, setSelectedIdol] = useState<number>(() => {
        const savedIdol = localStorage.getItem('selectedIdol');
        if (savedIdol) {
            const idolId = parseInt(savedIdol, 10);
            if (idolId >= 1 && idolId <= 52) {
                return idolId;
            }
        }
        return 1;
    });
    const chartSectionRef = useRef<HTMLDivElement>(null);
    const summaryStatsRef = useRef<HTMLDivElement>(null);
    // Tracks an idol the user has selected and is waiting to scroll to.
    // The scroll is deferred until that idol's data finishes loading (or
    // we know it's unavailable), so layout shifts from the lazy fetch
    // don't strand the viewport mid-scroll.
    const pendingScrollIdolRef = useRef<number | null>(null);

    const handleIdolSelect = (idolId: number) => {
        setSelectedIdol(idolId);
        localStorage.setItem('selectedIdol', idolId.toString());
        pendingScrollIdolRef.current = idolId;
    };

    // Resolve the pending scroll once the chart will render with stable
    // height — either because the idol's data is in cache, or because we
    // know the idol has no data for this event.
    React.useEffect(() => {
        const target = pendingScrollIdolRef.current;
        if (target == null) return;
        if (target !== selectedIdol) {
            // User clicked another idol while waiting; abandon this scroll.
            pendingScrollIdolRef.current = null;
            return;
        }
        const dataReady = idolPredictions.has(target);
        const known = availableIdols.size > 0 && !availableIdols.has(target);
        if (dataReady || known) {
            summaryStatsRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            pendingScrollIdolRef.current = null;
        }
    }, [selectedIdol, idolPredictions, availableIdols]);

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

    // Switch the selected idol to the first available one if the saved
    // value (or default 1) doesn't have data in this event.
    React.useEffect(() => {
        if (availableIdols.size === 0) return;
        if (!availableIdols.has(selectedIdol)) {
            const firstAvailable = Array.from(availableIdols).sort((a, b) => a - b)[0];
            if (firstAvailable !== undefined) {
                setSelectedIdol(firstAvailable);
                localStorage.setItem('selectedIdol', firstAvailable.toString());
            }
        }
    }, [availableIdols, selectedIdol]);

    // Lazy fetch the selected idol's full prediction data on demand.
    // The callback is idempotent — repeats are no-ops while a fetch is
    // in flight, and cache hits return immediately.
    React.useEffect(() => {
        if (availableIdols.has(selectedIdol)) {
            requestIdolData(selectedIdol);
        }
    }, [selectedIdol, availableIdols, requestIdolData]);

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

    const isSelectedIdolLoading = loadingIdols.has(selectedIdol);

    const score100 = getScoreForIdol(selectedIdol, '100');
    const score1000 = getScoreForIdol(selectedIdol, '1000');

    return (
        <div className="min-h-screen">
            <Banner isDark={isDark} toggleDark={toggleDark} />
            <div className="container mx-auto px-4 py-8">
                {/* Event title */}
                <div className="mb-6 pb-4 border-b border-base-300 text-center">
                    <h1 className="text-xl sm:text-2xl font-bold">
                        ミリシタ・ボーダー予想
                    </h1>
                    <p className="text-base sm:text-lg text-base-content/70 break-words mt-1">
                        {eventInfo.EventName}
                    </p>
                </div>

            {/* Idol Selector */}
            <IdolSelector
                selectedIdol={selectedIdol}
                onIdolSelect={handleIdolSelect}
                availableIdols={availableIdols}
            />

            {selectedIdol && idolPredictions.has(selectedIdol) && (
                <>
                    {/* Summary Stats */}
                    <CardContainer className="mb-8" ref={summaryStatsRef}>
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold flex items-center justify-center gap-2 flex-wrap">
                                <span>{getIdolName(selectedIdol)}の予測スコア</span>
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
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 100 Border Stats */}
                            <div className="text-center space-y-3">
                                <h3 className="text-xl text-primary font-bold">100位ボーダー</h3>
                                {hasDataForBorder(selectedIdol, '100') ? (
                                    <div className="stats stats-vertical shadow w-full max-w-xs mx-auto">
                                        <div className="stat">
                                            <div className="stat-title font-bold text-primary">予測スコア</div>
                                            <div className="stat-value text-primary min-w-[140px] mx-auto">
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
                                                十分なデータがありません
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 1000 Border Stats */}
                            <div className="text-center space-y-3">
                                <h3 className="text-xl font-bold text-secondary">1000位ボーダー</h3>
                                {hasDataForBorder(selectedIdol, '1000') ? (
                                    <div className="stats stats-vertical shadow w-full max-w-xs mx-auto">
                                        <div className="stat">
                                            <div className="stat-title font-bold text-secondary">予測スコア</div>
                                            <div className="stat-value text-secondary min-w-[140px] mx-auto">
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
                                    <div className="stats stats-vertical shadow w-full max-w-xs mx-auto">
                                        <div className="stat">
                                            <div className="stat-title font-bold text-error">データ不足</div>
                                            <div className="stat-value text-error text-lg">
                                                予測不可
                                            </div>
                                            <div className="stat-desc text-error">
                                                十分なデータがありません
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
                                <div className="relative w-full">
                                    {isSelectedIdolLoading && !idolPredictions.has(selectedIdol) ? (
                                        <div className="flex flex-col items-center justify-center min-h-[360px]">
                                            <div className="loading loading-spinner loading-md"></div>
                                            <p className="mt-3 text-sm text-base-content/70">
                                                {getIdolName(selectedIdol)} の予測データを読み込み中...
                                            </p>
                                        </div>
                                    ) : (
                                        <AnimatePresence mode="popLayout">
                                            <motion.div
                                                layout
                                                transition={{ type: 'spring', stiffness: 100, damping: 20, duration: 0.5 }}
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
                                    )}
                                </div>
                            </div>
                        </CardContainer>
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
            <UpdatesButton />
        </div>
    );
};

export default Type5EventPage;
