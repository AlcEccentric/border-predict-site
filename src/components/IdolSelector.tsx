import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CardContainer from './CardContainer';
import { getIdolName, getIdolColor, IDOL_GROUPS, getIdolGroupKey } from '../utils/idolData';

interface IdolSelectorProps {
    selectedIdol: number;
    onIdolSelect: (idolId: number) => void;
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

    // Keep the active tab in sync when the selected idol changes from outside
    // (e.g. auto-switch to the first available idol, or a deep-linked ?idol=).
    React.useEffect(() => {
        const groupKey = getIdolGroupKey(selectedIdol);
        if (groupKey && groupKey !== activeGroup) {
            setActiveGroup(groupKey);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIdol]);

    const handleImageError = (idolId: number) => {
        setImageErrors(prev => new Set(prev).add(idolId));
    };

    const getIdolImageUrl = (idolId: number) => {
        return `https://storage.matsurihi.me/mltd/idol_icon/${idolId}.png`;
    };

    const isSelected = (idolId: number) => selectedIdol === idolId;
    const hasData = (idolId: number) => availableIdols ? availableIdols.has(idolId) : true;

    const handleIdolClick = (idolId: number) => {
        onIdolSelect(idolId);
    };

    const allIdolCount = IDOL_GROUPS.reduce((n, g) => n + g.members.length, 0);
    const currentGroup = IDOL_GROUPS.find(g => g.key === activeGroup) ?? IDOL_GROUPS[0];

    // Count how many idols in the active group actually have data, so we can
    // show a hint if a whole group is unavailable.
    const availableInGroup = availableIdols
        ? currentGroup.members.filter(id => availableIdols.has(id)).length
        : currentGroup.members.length;

    return (
        <CardContainer className="mb-8">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">アイドル選択</h2>
                    <div className="text-sm text-base-content/70">
                        選択中: {getIdolName(selectedIdol)}
                    </div>
                </div>

                {/* Unit (group) tabs */}
                <div className="tabs tabs-boxed">
                    {IDOL_GROUPS.map(group => (
                        <a
                            key={group.key}
                            className={`tab flex-1 ${
                                activeGroup === group.key
                                    ? 'tab-active font-bold'
                                    : ''
                            }`}
                            onClick={() => setActiveGroup(group.key)}
                        >
                            {group.name}
                        </a>
                    ))}
                </div>

                <div className="text-sm text-base-content/70">
                    表示したいアイドルを選択してください
                    {availableIdols && availableIdols.size < allIdolCount && availableInGroup === 0 && (
                        <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded text-warning text-xs">
                            このユニットには予測データのあるアイドルがいません。
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-[repeat(13,minmax(0,1fr))] gap-2">
                    {currentGroup.members.map(idolId => (
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
                            onClick={() => hasData(idolId) && handleIdolClick(idolId)}
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
                    ))}
                </div>
            </div>
        </CardContainer>
    );
};

export default IdolSelector;
