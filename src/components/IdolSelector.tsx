import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardContainer from './CardContainer';
import { getIdolName, getIdolColor, IDOL_GROUPS, getIdolGroupKey } from '../utils/idolData';

interface IdolSelectorProps {
    selectedIdol: number;
    onIdolSelect: (idolId: number, opts?: { allowScroll?: boolean }) => void;
    availableIdols?: Set<number>; // Add available idols prop
}

const IdolSelector: React.FC<IdolSelectorProps> = ({
    selectedIdol,
    onIdolSelect,
    availableIdols
}) => {
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    // Active unit tab. Defaults to the group of the currently selected idol
    // so the selection is visible on first render.
    const [activeGroup, setActiveGroup] = useState<string>(
        () => getIdolGroupKey(selectedIdol) ?? IDOL_GROUPS[0].key,
    );

    // The full selector card. Observed so we can reveal a condensed sticky
    // bar once it scrolls up out of view (mobile only).
    const selectorRef = useRef<HTMLDivElement>(null);
    const [showSticky, setShowSticky] = useState(false);

    // Keep the active tab in sync when the selected idol changes from outside
    // (e.g. auto-switch to the first available idol, or a deep-linked ?idol=).
    React.useEffect(() => {
        const groupKey = getIdolGroupKey(selectedIdol);
        if (groupKey && groupKey !== activeGroup) {
            setActiveGroup(groupKey);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIdol]);

    // Reveal the condensed sticky bar once the full selector has scrolled up
    // past the banner. rootMargin top offset (-56px) matches the sticky
    // banner height so the bar appears right as the selector tucks behind it.
    useEffect(() => {
        const el = selectorRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
            },
            { rootMargin: '-56px 0px 0px 0px', threshold: 0 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const handleImageError = (idolId: number) => {
        setImageErrors(prev => new Set(prev).add(idolId));
    };

    const getIdolImageUrl = (idolId: number) => {
        return `https://storage.matsurihi.me/mltd/idol_icon/${idolId}.png`;
    };

    const isSelected = (idolId: number) => selectedIdol === idolId;
    const hasData = (idolId: number) => availableIdols ? availableIdols.has(idolId) : true;

    const allIdolCount = IDOL_GROUPS.reduce((n, g) => n + g.members.length, 0);
    const currentGroup = IDOL_GROUPS.find(g => g.key === activeGroup) ?? IDOL_GROUPS[0];

    // Count how many idols in the active group actually have data, so we can
    // show a hint if a whole group is unavailable.
    const availableInGroup = availableIdols
        ? currentGroup.members.filter(id => availableIdols.has(id)).length
        : currentGroup.members.length;

    // Full idol tile used in the main grid.
    const renderIdol = (idolId: number) => (
        <motion.div
            key={idolId}
            whileHover={{ scale: hasData(idolId) ? 1.05 : 1.02 }}
            whileTap={{ scale: hasData(idolId) ? 0.95 : 1.0 }}
            className={`
                relative rounded-lg overflow-hidden border-2 transition-all duration-200
                ${!hasData(idolId)
                    ? 'cursor-not-allowed opacity-50 border-base-300 bg-base-200'
                    : `cursor-pointer ${isSelected(idolId)
                        ? 'border-primary shadow-lg ring-2 ring-primary/30'
                        : 'border-base-300 hover:border-primary/50'
                    }`
                }
            `}
            onClick={() => hasData(idolId) && onIdolSelect(idolId)}
            style={{
                borderColor: isSelected(idolId) && hasData(idolId) ? getIdolColor(idolId) : undefined,
                '--hover-border-color': getIdolColor(idolId)
            } as React.CSSProperties & { '--hover-border-color': string }}
            onMouseEnter={(e) => {
                if (!isSelected(idolId) && hasData(idolId)) {
                    e.currentTarget.style.borderColor = getIdolColor(idolId);
                }
            }}
            onMouseLeave={(e) => {
                if (!isSelected(idolId) && hasData(idolId)) {
                    e.currentTarget.style.borderColor = '';
                }
            }}
        >
            <div className="aspect-square relative bg-base-200">
                {!imageErrors.has(idolId) ? (
                    <img
                        src={getIdolImageUrl(idolId)}
                        alt={getIdolName(idolId)}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(idolId)}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-center p-1">
                        <span className="text-base-content/50">
                            {getIdolName(idolId)}
                        </span>
                    </div>
                )}

                {isSelected(idolId) && hasData(idolId) && (
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        // 8-digit hex: idol color + B3 (~70% alpha) for parity with bg-primary/70.
                        style={{ backgroundColor: `${getIdolColor(idolId)}B3` }}
                    >
                        <div
                            className="rounded-full p-1"
                            style={{ backgroundColor: getIdolColor(idolId) }}
                        >
                            <svg
                                className="w-4 h-4 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                )}

                {!hasData(idolId) && (
                    <div className="absolute inset-0 bg-base-300/80 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-xs text-base-content/70 font-semibold">
                                データ不足
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-xs text-center p-1 bg-base-100/90">
                <div className="truncate">
                    {getIdolName(idolId)}
                </div>
            </div>
        </motion.div>
    );

    // Compact circular avatar used in the condensed sticky strip. Selecting
    // here never auto-scrolls — the user is already viewing the scores.
    const renderCompactIdol = (idolId: number) => {
        const selected = isSelected(idolId);
        const enabled = hasData(idolId);
        return (
            <button
                key={idolId}
                type="button"
                disabled={!enabled}
                onClick={() => enabled && onIdolSelect(idolId, { allowScroll: false })}
                className={`relative shrink-0 rounded-full overflow-hidden border-2 transition-all ${
                    enabled ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                }`}
                style={{
                    width: 44,
                    height: 44,
                    borderColor: selected ? getIdolColor(idolId) : 'transparent',
                }}
                aria-label={getIdolName(idolId)}
                aria-pressed={selected}
                title={getIdolName(idolId)}
            >
                {!imageErrors.has(idolId) ? (
                    <img
                        src={getIdolImageUrl(idolId)}
                        alt={getIdolName(idolId)}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(idolId)}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-base-200 text-[9px] text-base-content/50">
                        {getIdolName(idolId).slice(0, 2)}
                    </div>
                )}
                {selected && (
                    <span
                        className="absolute inset-0"
                        style={{ backgroundColor: `${getIdolColor(idolId)}33` }}
                    />
                )}
            </button>
        );
    };

    const renderGroupTabs = () => (
        <div className="tabs tabs-boxed">
            {IDOL_GROUPS.map(group => (
                <a
                    key={group.key}
                    className={`tab flex-1 ${
                        activeGroup === group.key ? 'tab-active font-bold' : ''
                    }`}
                    onClick={() => setActiveGroup(group.key)}
                >
                    {group.name}
                </a>
            ))}
        </div>
    );

    return (
        <>
            <CardContainer className="mb-8" ref={selectorRef}>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">アイドル選択</h2>
                        <div className="text-sm text-base-content/70">
                            選択中: {getIdolName(selectedIdol)}
                        </div>
                    </div>

                    {/* Unit (group) tabs */}
                    {renderGroupTabs()}

                    <div className="text-sm text-base-content/70">
                        表示したいアイドルを選択してください
                        {availableIdols && availableIdols.size < allIdolCount && availableInGroup === 0 && (
                            <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded text-warning text-xs">
                                このユニットには予測データのあるアイドルがいません。
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-[repeat(13,minmax(0,1fr))] gap-2">
                        {currentGroup.members.map(idolId => renderIdol(idolId))}
                    </div>
                </div>
            </CardContainer>

            {/* Condensed floating selector: appears on mobile once the full
                selector scrolls behind the banner. A vertical rail on the
                left edge keeps it clear of the top banner and the score
                heading, and lets users switch idols in place. */}
            <AnimatePresence>
                {showSticky && (
                    <motion.div
                        className="sm:hidden fixed left-2 top-84 bottom-4 z-30 w-20 flex flex-col bg-base-200/95 backdrop-blur border border-base-300 rounded-xl shadow-lg overflow-hidden"
                        initial={{ x: -24, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -24, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                        {/* Vertical unit tabs */}
                        <div className="flex flex-col gap-1 p-1.5 border-b border-base-300">
                            {IDOL_GROUPS.map(group => (
                                <button
                                    key={group.key}
                                    type="button"
                                    onClick={() => setActiveGroup(group.key)}
                                    className={`w-full text-center text-[10px] leading-tight rounded-md px-1 py-1 transition-colors ${
                                        activeGroup === group.key
                                            ? 'bg-primary text-primary-content font-bold'
                                            : 'hover:bg-base-300 text-base-content/70'
                                    }`}
                                >
                                    {group.name}
                                </button>
                            ))}
                        </div>

                        {/* Scrollable avatar column for the active unit */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-1.5 flex flex-col items-center gap-2">
                            {currentGroup.members.map(idolId => renderCompactIdol(idolId))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default IdolSelector;
