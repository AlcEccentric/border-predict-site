import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardContainer from './CardContainer';
import IdolSelector from './IdolSelector';
import Type5MainChart from './Type5MainChart';
import Banner from './Banner';
import UpdatesButton from './UpdatesButton';
import Footer from './Footer';
import FAQ from './FAQ';
import LastUpdated from './LastUpdated';
import { IdolPredictionData, EventInfo, getFinalCI } from '../types';
import { getIdolName } from '../utils/idolData';
import { getIntParam, setParam } from '../utils/urlState';

/**
 * Renders one border's stats column (100位 or 1000位). Three visual states
 * driven by the same shape so the column transitions smoothly between them
 * via CSS opacity:
 *   - loading: spinner where the score would be
 *   - has data: real predicted score + CI rows
 *   - no data: 「予測不可」 fallback
 *
 * If real `ci75` / `ci90` final-time bounds are provided, they're shown as
 * proper 75% / 90% confidence intervals. Otherwise we fall back to the
 * legacy ±5% / ±10% multiplier rows so older data still renders.
 */
const BorderStatsColumn: React.FC<{
    heading: string;
    colorClass: string; // e.g. "text-primary"
    score: number | null;
    isLoading: boolean;
    hasData: boolean;
    ci75?: { lower: number; upper: number } | null;
    ci90?: { lower: number; upper: number } | null;
}> = ({ heading, colorClass, score, isLoading, hasData, ci75, ci90 }) => {
    const showRealStats = !isLoading && hasData && score !== null;
    const useRealCI = ci75 != null && ci90 != null;
    return (
        <div className="text-center space-y-3">
            <h3 className={`text-xl font-bold ${colorClass}`}>{heading}</h3>
            {/* Reserved min-height so swapping states doesn't jump the layout. */}
            <div className="min-h-[12rem]">
                <AnimatePresence mode="wait" initial={false}>
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="stats stats-vertical shadow w-full max-w-xs mx-auto"
                        >
                        <div className="stat">
                            <div className={`stat-title font-bold ${colorClass}`}>予測スコア</div>
                            <div className={`stat-value ${colorClass} min-h-[3rem] flex items-center justify-center`}>
                                <span className="loading loading-spinner loading-md"></span>
                            </div>
                            <div className="stat-desc">計算中...</div>
                        </div>
                    </motion.div>
                ) : showRealStats ? (
                    <motion.div
                        key="data"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="stats stats-vertical shadow w-full max-w-xs mx-auto"
                    >
                        <div className="stat">
                            <div className={`stat-title font-bold ${colorClass}`}>予測スコア</div>
                            <div className={`stat-value ${colorClass} min-w-[140px] mx-auto`}>
                                {Math.round(score!).toLocaleString()}
                            </div>
                        </div>
                        {useRealCI ? (
                            <>
                                <div className="stat">
                                    <div className={`stat-title font-bold ${colorClass}`}>75% 信頼区間</div>
                                    <div className={`stat-desc font-bold ${colorClass}`}>
                                        {Math.round(ci75!.lower).toLocaleString()} ～ {Math.round(ci75!.upper).toLocaleString()}
                                    </div>
                                </div>
                                <div className="stat">
                                    <div className={`stat-title font-bold ${colorClass}`}>90% 信頼区間</div>
                                    <div className={`stat-desc font-bold ${colorClass}`}>
                                        {Math.round(ci90!.lower).toLocaleString()} ～ {Math.round(ci90!.upper).toLocaleString()}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="stat">
                                    <div className={`stat-title font-bold ${colorClass}`}>±5% 誤差区間</div>
                                    <div className={`stat-desc font-bold ${colorClass}`}>
                                        {Math.round(score! * 0.95).toLocaleString()} ～ {Math.round(score! * 1.05).toLocaleString()}
                                    </div>
                                </div>
                                <div className="stat">
                                    <div className={`stat-title font-bold ${colorClass}`}>±10% 誤差区間</div>
                                    <div className={`stat-desc font-bold ${colorClass}`}>
                                        {Math.round(score! * 0.9).toLocaleString()} ～ {Math.round(score! * 1.1).toLocaleString()}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="stats stats-vertical shadow w-full max-w-xs mx-auto"
                    >
                        <div className="stat">
                            <div className="stat-title font-bold text-error">データ不足</div>
                            <div className="stat-value text-error text-lg">予測不可</div>
                            <div className="stat-desc text-error">十分なデータがありません</div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
};

interface Type5EventPageProps {
    eventInfo: EventInfo;
    idolPredictions: Map<number, IdolPredictionData>;
    availableIdols: Set<number>;
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
    requestIdolData,
    loading,
    theme,
    isDark,
    toggleDark
}) => {
    // Initialize selectedIdol from URL (?idol=N) first so shared links open
    // the right idol, then fall back to localStorage, then default to 1.
    const [selectedIdol, setSelectedIdol] = useState<number>(() => {
        const urlIdol = getIntParam('idol', 1, 52);
        if (urlIdol !== null) return urlIdol;
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

    const handleIdolSelect = (idolId: number, opts?: { allowScroll?: boolean }) => {
        setSelectedIdol(idolId);
        localStorage.setItem('selectedIdol', idolId.toString());
        setParam('idol', idolId.toString());
        // Auto-scroll to the score card only on the narrow (mobile) layout,
        // where the selector and the scores don't fit on screen together.
        // On wider screens everything is already visible, so scrolling is
        // unnecessary (and jarring). The floating picker passes
        // allowScroll:false since the user is already viewing the scores.
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
        pendingScrollIdolRef.current = isMobile && (opts?.allowScroll ?? true) ? idolId : null;
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

    const getCIForIdol = (
        idolId: number,
        border: '100' | '1000',
        level: 75 | 90,
    ): { lower: number; upper: number } | null => {
        const idolData = idolPredictions.get(idolId);
        if (!idolData) return null;
        const prediction = border === '100' ? idolData.prediction100 : idolData.prediction1000;
        const bounds = prediction?.data.raw.bounds?.[level];
        return getFinalCI(bounds);
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
                setParam('idol', firstAvailable.toString());
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

    const isSelectedIdolLoading = availableIdols.has(selectedIdol) && !idolPredictions.has(selectedIdol);

    const score100 = getScoreForIdol(selectedIdol, '100');
    const score1000 = getScoreForIdol(selectedIdol, '1000');
    const ci100_75 = getCIForIdol(selectedIdol, '100', 75);
    const ci100_90 = getCIForIdol(selectedIdol, '100', 90);
    const ci1000_75 = getCIForIdol(selectedIdol, '1000', 75);
    const ci1000_90 = getCIForIdol(selectedIdol, '1000', 90);

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

            {selectedIdol && (
                <>
                    {/* Summary Stats */}
                    <CardContainer className="mb-8 scroll-mt-20" ref={summaryStatsRef}>
                        <div className="flex justify-end mb-1">
                            <LastUpdated
                                timestamp={idolPredictions.get(selectedIdol)?.lastModified}
                            />
                        </div>
                        {idolPredictions.get(selectedIdol)?.stale && (
                            <div className="mb-3 p-2 rounded bg-warning/10 border border-warning/20 text-warning text-sm text-center">
                                データがしばらく更新されていません。最新の状況とは異なる可能性があります。
                            </div>
                        )}
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold flex items-center justify-center gap-2 flex-wrap">
                                <span>{getIdolName(selectedIdol)}</span>
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <BorderStatsColumn
                                heading="100位ボーダー"
                                colorClass="text-primary"
                                score={score100}
                                isLoading={isSelectedIdolLoading}
                                hasData={hasDataForBorder(selectedIdol, '100')}
                                ci75={ci100_75}
                                ci90={ci100_90}
                            />
                            <BorderStatsColumn
                                heading="1000位ボーダー"
                                colorClass="text-secondary"
                                score={score1000}
                                isLoading={isSelectedIdolLoading}
                                hasData={hasDataForBorder(selectedIdol, '1000')}
                                ci75={ci1000_75}
                                ci90={ci1000_90}
                            />
                        </div>
                    </CardContainer>

                    {/* Main Chart Section */}
                    <div ref={chartSectionRef}>
                        <CardContainer className="mb-4">
                            <div className="space-y-4">
                                <div className="relative w-full min-h-[360px]">
                                    <AnimatePresence mode="wait" initial={false}>
                                        {isSelectedIdolLoading ? (
                                            <motion.div
                                                key="chart-loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                className="flex flex-col items-center justify-center min-h-[360px]"
                                            >
                                                <div className="loading loading-spinner loading-md"></div>
                                                <p className="mt-3 text-sm text-base-content/70">
                                                    {getIdolName(selectedIdol)} の予測データを読み込み中...
                                                </p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key={`chart-${selectedIdol}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
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
                                        )}
                                    </AnimatePresence>
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
                <FAQ eventType={eventInfo.EventType} />
            </CardContainer>
            </div>
            <UpdatesButton />
            <Footer />
        </div>
    );
};

export default Type5EventPage;
