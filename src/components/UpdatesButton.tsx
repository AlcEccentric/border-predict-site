import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

const UpdatesButton: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Floating button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="btn btn-primary shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-4 py-2 text-sm font-medium"
                title="最新の更新情報"
            >
                {isExpanded ? <X size={16} className="mr-1" /> : <Info size={16} className="mr-1" />}
                更新情報
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="absolute bottom-16 right-0 w-80 max-w-[90vw] bg-base-100 border border-base-300 rounded-lg shadow-xl p-4 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg">更新情報 (2025/09/18)</h3>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="btn btn-ghost btn-xs"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                        <div className="border-l-4 border-primary pl-3">
                            <h4 className="font-semibold text-primary mb-1">信頼区間の表示を追加</h4>
                            <p className="text-base-content/80">
                                メイングラフに75%・90%の信頼区間を表示するようになりました。
                                以前は進行度に応じた精度情報をサイトの下部に表示していましたが、信頼区間を表示することで、
                                より直感的に予測精度を理解できるようになりました。
                            </p>
                        </div>
                        
                        <div className="border-l-4 border-secondary pl-3">
                            <h4 className="font-semibold text-secondary mb-1">正規化基準の変更</h4>
                            <p className="text-base-content/80">
                                これまでは固定の7.25日を基準にデータを正規化していましたが、今後は進行中のイベントの開催期間を基準とする方式に変更しました。
                                これにより、近傍グラフでの比較がより直感的になっています。
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-base-300">
                        <p className="text-xs text-base-content/60">
                            詳細は「解説」セクションの「予測精度について」と「スコアの正規化方法について」をご確認ください
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdatesButton;