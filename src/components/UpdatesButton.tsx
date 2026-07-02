import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

const UpdatesButton: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const currentUpdateKey = "update-2026-07-02"; // Change this when there's a new update
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
                        <div className="border-l-4 border-secondary pl-4">
                            <h4 className="font-bold text-secondary mb-2">スキップパスとDX+パスの影響について (2026/07/02)</h4>
                            <p className="text-sm text-base-content/80">
                                今回のイベントでは、スキップパス報酬の導入およびDX+パス購入者によるオートパス追加購入の無制限化という2つの仕様変更が行われています。
                                これらの影響により、序盤のスコア推移が従来よりやや高めに推移している可能性があります。
                                現在も状況を継続して観察しており、必要に応じて予測モデルの調整を行っています。
                                今後数日間は予告なく予測結果が変わる場合がありますので、あらかじめご了承ください。
                            </p>
                        </div>

                        <div className="border-l-4 border-primary pl-4">
                            <h4 className="font-bold text-primary mb-2">更新情報 (2026/06/24)</h4>
                            <p className="text-sm text-base-content/80">
                                周年イベントの体験をより良くするため、細かなアップデートを行いました。
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdatesButton;