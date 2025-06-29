import React from 'react';

const FAQ: React.FC = () => {
    return (
        <div className="mt-4">
            <h2 className="text-2xl font-bold mb-4">解説</h2>
            <div className="space-y-4">
                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-medium">
                        予測について
                    </div>
                    <div className="collapse-content">
                        <p>
                            予測値は過去の類似イベントデータを基に算出されており、実際の結果とは異なる場合があります。
                            参考程度にご利用ください。
                        </p>
                        <p className="mt-2">
                            <strong>近傍イベント:</strong> 近傍イベント表示を有効にすると、選択したアイドルの過去の類似イベントとの比較ができます。
                            アイドルとボーダーを選択して、個別の近傍データを確認できます。
                        </p>
                    </div>
                </div>

                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" /> 
                    <div className="collapse-title text-xl font-medium">
                        近傍イベントとは？
                    </div>
                    <div className="collapse-content">
                        <p>
                            近傍イベントとは、現在進行中のイベントと「イベント形式」や「スコアの伸び方」などが類似している過去のイベントのことです。<br />
                            これらのイベントのスコア推移を比較・参照することで、現在のイベントが今後どのように進行するかを予測する材料になります。<br />
                            特に同じ形式・同じ開催期間のイベントであれば、ボーダーライン（100位や2500位など）の伸び方も似てくる傾向があるため、より正確な予測に繋がります。
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
                            イベントの開催日数が異なる場合でも比較できるように、
                            データを標準化したものです。これにより、異なるイベント間での
                            スコアの伸び方の比較が可能になります。
                        </p>
                    </div>
                </div>

                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-medium">
                        スコアの正規化方法について
                    </div>
                    <div className="collapse-content">
                        <p>
                            イベントごとに開催日数やブースト開始タイミングが異なるため、本サイトではスコア推移を比較しやすくするために正規化処理を行っています。<br />
                            <b>現在のイベントと同じ長さの近傍イベント</b>はリサンプリングのみのため、表示スコアは実際の最終スコアと一致します。<br />
                            <b>異なる長さの近傍イベント</b>は、ブースト開始位置を同じ比率に合わせ、スコアも長さの比率でスケーリングしています。<br />
                            そのため、<b>正規化後のスコアは実際のスコアと異なる場合があります</b>。<br />
                            <span className="text-error font-bold">実際のボーダー推移を比較したい場合は、同じ開催日数のイベントを参照するのがおすすめです。</span>

                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;