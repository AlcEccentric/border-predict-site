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
                            <strong>予測プロセス:</strong> 
                            <br />1. 現在のイベントと類似する過去のイベントを「近傍イベント」として特定
                            <br />2. 近傍イベントのスコア推移を現在のイベントの既知データに合わせて調整（アライメント）
                            <br />3. 距離に基づく重み付けを行い、複数の近傍イベントから最終予測を算出
                        </p>
                        <p className="mt-2">
                            <strong>アライメント方法:</strong> 線形回帰、アフィン変換、比例調整の3つの方法を用いて、
                            近傍イベントのスコア推移を現在のイベントの直近数時間のトレンドに最適に合わせます。
                        </p>
                        <p className="mt-2">
                            <strong>重み付け計算:</strong> アライメント後、各近傍イベントと現在のイベントとの距離を計算し、
                            距離が近いほど高い重みを与えて最終的な予測スコアを算出します。
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
                        <p className="mt-2">
                            <strong>近傍イベントの表示について:</strong><br />
                            「近傍1」は最も類似度の高い（距離が最も近い）イベント、「近傍2」は2番目に類似度の高いイベント、という順番で表示されます。<br />
                            数字が小さいほど現在のイベントとの類似度が高く、予測の精度により大きく影響します。
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
                        <p className="mt-2">
                            <strong>補足:</strong> アニバーサリーイベントは全て同じ開催日数のため、正規化後も最終スコアは実際のスコアと一致します。
                        </p>
                    </div>
                </div>

                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-medium">
                        データソース・不具合報告
                    </div>
                    <div className="collapse-content">
                        <p>
                            <strong>データソース:</strong>
                            <br />ボーダーデータおよびアイドル画像は、
                            <a href="https://www.matsurihi.me/" target="_blank" rel="noopener noreferrer" className="link link-primary">
                                https://www.matsurihi.me
                            </a>
                            から提供されています。
                        </p>
                        <p className="mt-2">
                            <strong>お問い合わせ:</strong>
                            <br />不具合報告や質問等は、
                            <a href="mailto:yuenimillionlive@proton.me" className="link link-primary">
                                yuenimillionlive@proton.me
                            </a>
                            または
                            <a href="https://twitter.com/amakabeP" target="_blank" rel="noopener noreferrer" className="link link-primary">
                                @amakabeP
                            </a>
                            までご連絡ください。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;