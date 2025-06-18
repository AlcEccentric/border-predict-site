import React from 'react';

const FAQ: React.FC = () => {
    return (
        <div className="mt-4">
            <h2 className="text-2xl font-bold mb-4">用語について</h2>
            <div className="space-y-4">
                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" /> 
                    <div className="collapse-title text-xl font-medium">
                        近傍とは？
                    </div>
                    <div className="collapse-content">
                        <p>
                            近傍とは、現在進行中のイベントと似たような傾向を示した過去のイベントのことです。
                            これらのイベントの推移を参考にすることで、より正確な予測が可能になります。
                        </p>
                    </div>
                </div>

                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-medium">
                        正規化された軌跡について
                    </div>
                    <div className="collapse-content">
                        <p>
                            イベントの長さや開始時間が異なる場合でも比較できるように、
                            データを標準化したものです。これにより、異なるイベント間での
                            スコアの伸び方の比較が可能になります。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;