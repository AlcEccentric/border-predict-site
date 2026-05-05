import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

const UpdatesButton: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const currentUpdateKey = "update-2026-05-05"; // Change this when there's a new update
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
        <div className="fixed bottom-4 right-6 sm:right-4 z-50">
            {/* Single button with notification dot */}
            <div className="relative">
                <button
                    onClick={handleToggle}
                    className="btn btn-primary shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-12 h-12 p-0 sm:w-auto sm:h-auto sm:px-4 sm:py-2 text-sm font-medium"
                    title="更新情報・Twitter/X ボット"
                    aria-label="更新情報・Twitter/X ボット"
                >
                    {isExpanded ? <X size={16} /> : <Info size={16} />}
                    <span className="hidden sm:inline ml-1">更新情報 &amp; Bot</span>
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
                            <h4 className="font-bold text-primary mb-2">更新情報 (2026/05/05)</h4>
                            <div className="pl-2 space-y-3">
                                <div>
                                    <h5 className="font-bold mb-1 text-sm">13thライブ限定テーマ</h5>
                                    <p className="text-sm text-base-content/80">
                                        13thライブ限定テーマを追加しました。表示期間はライブ配信の視聴可能期間と同じく、日本標準時5月18日23:59までです。チケットをご購入された方は、ライブ配信のご視聴をお忘れなく！
                                    </p>
                                </div>
                                <div>
                                    <h5 className="font-bold mb-1 text-sm">予測精度とモバイル表示の改善</h5>
                                    <p className="text-sm text-base-content/80">
                                        類似イベントの選定において、スコアの上昇率（傾き）をより重視するよう調整し、予測精度を改善しました。モバイル表示を改善しました。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdatesButton;