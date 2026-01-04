import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

const UpdatesButton: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const currentUpdateKey = "update-2026-01-04"; // Change this when there's a new update
    const [hasNewUpdate, setHasNewUpdate] = useState(() => {
        const lastSeen = localStorage.getItem('lastSeenUpdate');
        return lastSeen !== currentUpdateKey;
    });

    const handleToggle = () => {
        if (hasNewUpdate) {
            // Mark update as seen
            localStorage.setItem('lastSeenUpdate', currentUpdateKey);
            setHasNewUpdate(false);
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Single button with notification dot */}
            <div className="relative">
                <button
                    onClick={handleToggle}
                    className="btn btn-primary shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-4 py-2 text-sm font-medium"
                    title="更新情報・Twitter/X ボット"
                >
                    {isExpanded ? <X size={16} className="mr-1" /> : <Info size={16} className="mr-1" />}
                    更新情報 & Bot
                </button>
                
                {/* Red notification dot */}
                {hasNewUpdate && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
            </div>

            {/* Expanded content with both sections */}
            {isExpanded && (
                <div className="absolute bottom-16 right-0 w-80 max-w-[90vw] bg-base-100 border border-base-300 rounded-lg shadow-xl p-4 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">更新情報</h3>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="btn btn-ghost btn-xs"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    
                    <div className="space-y-6">
                        {/* Twitter/X Bot section */}
                        <div className="border-l-4 border-accent pl-4">
                            <h4 className="font-bold text-accent mb-2 flex items-center">
                                Twitter/X ボット
                            </h4>
                            <p className="text-sm text-base-content/80 mb-3">
                                予測結果を2時間ごとに自動投稿するBot:
                            </p>
                            <div className="text-center">
                                <a 
                                    href="https://x.com/YueniMillionB1" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="btn btn-accent btn-sm"
                                >
                                    @YueniMillionB1 をフォロー
                                </a>
                            </div>
                        </div>

                        {/* Updates section */}
                        <div className="border-l-4 border-primary pl-4">
                            <h4 className="font-bold text-primary mb-2">モデル更新情報 (2026/01/04)</h4>
                            <div className="pl-2">
                                <h5 className="font-bold mb-1 text-sm">プラチナスターテールの対応</h5>
                                <p className="text-sm text-base-content/80">
                                    プラチナスターテールの予測に対応しました！
                                    開催回数が少ないため、ルールが似ているプラチナスターチームやプラチナスタータイムのデータも併せて参考にし、予測に活かしています。
　　　　　　　　　　　　　　　　　　　　　 <strong> ただし、チーム・タイムのデータを加えても十分とは言えません。あくまで参考程度に留めてください。</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdatesButton;