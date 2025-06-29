import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CardContainer from './CardContainer';
import { getIdolName, getIdolColor } from '../utils/idolData';

interface IdolSelectorProps {
    selectedIdol: number;
    onIdolSelect: (idolId: number) => void;
}

const IdolSelector: React.FC<IdolSelectorProps> = ({
    selectedIdol,
    onIdolSelect
}) => {
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    // Generate idol list for 52 idols (assuming IDs 1-52)
    const allIdols = Array.from({ length: 52 }, (_, i) => i + 1);

    const handleImageError = (idolId: number) => {
        setImageErrors(prev => new Set(prev).add(idolId));
    };

    const getIdolImageUrl = (idolId: number) => {
        return `https://storage.matsurihi.me/mltd/idol_icon/${idolId}.png`;
    };

    const isSelected = (idolId: number) => selectedIdol === idolId;

    const handleIdolClick = (idolId: number) => {
        onIdolSelect(idolId);
    };

    return (
        <CardContainer className="mb-8">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">アイドル選択</h2>
                    <div className="text-sm text-base-content/70">
                        選択中: {getIdolName(selectedIdol)}
                    </div>
                </div>
                
                <div className="text-sm text-base-content/70">
                    表示したいアイドルを選択してください
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-13 gap-2">
                    {allIdols.map(idolId => (
                        <motion.div
                            key={idolId}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                                relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200
                                ${isSelected(idolId) 
                                    ? 'border-primary shadow-lg ring-2 ring-primary/30' 
                                    : 'border-base-300 hover:border-primary/50'
                                }
                            `}
                            onClick={() => handleIdolClick(idolId)}
                            style={{
                                borderColor: isSelected(idolId) ? getIdolColor(idolId) : undefined,
                                '--hover-border-color': getIdolColor(idolId)
                            } as React.CSSProperties & { '--hover-border-color': string }}
                            onMouseEnter={(e) => {
                                if (!isSelected(idolId)) {
                                    e.currentTarget.style.borderColor = getIdolColor(idolId);
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected(idolId)) {
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
                                
                                {isSelected(idolId) && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
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
