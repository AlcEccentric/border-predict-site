import React from 'react';

const FAQ: React.FC = () => {
    return (
        <div className="mt-4">
            <h2 className="text-2xl font-bold mb-4">解説</h2>
            <div className="space-y-4">
                {/* 予測について section */}
                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
                        予測について
                    </div>
                    <div className="collapse-content">
                        <p>
                            予測値は過去の類似イベントデータをもとに算出していますが、実際の結果とは異なる場合があります。参考情報としてご利用ください。
                        </p>
                        <p className="mt-2">
                            <strong>予測の流れ:</strong><br />
                            1. 現在のイベントデータを正規化し、過去のイベントと比較して近傍イベントを選定<br />
                            2. 近傍イベントのスコア推移を現在の傾向に合わせて調整<br />
                            3. 類似度に応じて重み付けし、複数イベントから予測値を算出
                        </p>
                    </div>
                </div>
                {/* 近傍イベントとは section */}
                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
                        近傍イベントとは
                    </div>
                    <div className="collapse-content">
                        <p>
                            近傍イベントとは、現在進行中のイベントと「イベント形式」や「スコアの伸び方（特に現在の進行度付近）」などが類似している過去のイベントのことです。<br />
                            これらのイベントのスコア推移を比較・参照することで、現在のイベントが今後どのように進行するかを予測する材料になります。<br />
                            特に同じ形式・同じ開催期間のイベントであれば、ボーダーライン（100位や2500位など）の伸び方も似てくる傾向があるため、より正確な予測に繋がります。
                        </p>
                        <p className="mt-2">
                            <strong>近傍イベント表示について:</strong><br />
                            「近傍1」は最も類似度の高い（距離が最も近い）イベント、「近傍2」は2番目に類似度の高いイベントを示します。<br />
                            数字が小さいほど現在のイベントとの類似度が高く、予測精度により大きく影響します。<br />
                            <span className="block mt-2 text-base-content/70">
                                <strong>なお、近傍イベントの数（近傍1〜N）は、現在のイベントの進行度やイベント形式に応じて選択されます。<br />
                                この数は、過去データで最も良い予測結果が得られた設定に基づいています。</strong>
                            </span>
                        </p>
                    </div>
                </div>
                {/* 予測精度について section */}
                <div className="collapse collapse-plus bg-base-200" id="prediction-accuracy">
                <input type="checkbox" />
                <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
                    予測精度について
                </div>
                <div className="collapse-content">
                    <p>
                    上のグラフに表示される「信頼区間」は、実際の最終スコアがどこまでずれる可能性があるかを示しています。
                    この範囲は、過去のイベントで予測と結果がどれくらい違ったかをもとに計算しています。
                    </p>

                    <div className="mt-4">
                    <h4 className="text-lg font-semibold mb-2">信頼区間とは</h4>
                    <p className="text-sm mb-2">
                        実際のスコアがどのくらいの確率で範囲内に収まるかを示します。
                    </p>
                    <ul className="ml-4 list-disc text-sm">
                        <li><strong>75%信頼区間:</strong> 75%の確率で範囲内に収まる</li>
                        <li><strong>90%信頼区間:</strong> 90%の確率で範囲内に収まる</li>
                    </ul>
                    <p className="mt-2 text-sm text-base-content/70">
                        → 信頼度が高いほど当たりやすいですが、その分、範囲は広くなります。
                    </p>
                    </div>

                    <div className="mt-4">
                    <h4 className="text-lg font-semibold mb-2">算出の流れ</h4>
                    <ol className="ml-4 list-decimal text-sm space-y-1">
                        <li>
                        <strong>相対誤差を計算:</strong> 過去イベントの予測と実際のスコアを比較し、ずれを割合（相対誤差）として計算
                        </li>
                        <li>
                        <strong>分布を分析:</strong> 相対誤差の分布からパーセンタイルを計算
                        <ul className="ml-6 list-disc">
                            <li>75%信頼区間 → 12.5～87.5パーセンタイル</li>
                            <li>90%信頼区間 → 5～95パーセンタイル</li>
                        </ul>
                        </li>
                        <li>
                        <strong>補間:</strong> 誤差データは一定間隔でしか計算していないため、その間の値は前後のデータをもとに滑らかに補っています
                        </li>
                        <li>
                        <strong>適用:</strong> 現在の予測値に誤差範囲を当てはめて信頼区間を生成
                        </li>
                    </ol>
                    </div>

                    <p className="mt-4 text-sm">
                    <strong>⚠ 注意:</strong> 信頼区間はあくまで過去データに基づく推定値です。
                    参加者の行動や特殊な状況によっては、実際の結果が範囲外になることもあります。
                    </p>
                </div>
                </div>

                {/* データ更新頻度と古いデータについて section */}
                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
                        データ更新頻度と古いデータについて
                    </div>
                    <div className="collapse-content">
                        <p>
                            <strong>データ更新頻度:</strong>
                            <br />予測データは通常1時間ごとに更新されます。
                        </p>
                        <p className="mt-2">
                            <strong>古いデータが表示される場合:</strong>
                            <br />ブラウザのキャッシュが原因で古いデータが表示される場合があります。
                            以下の方法で最新データを取得できます：
                        </p>
                        <ul className="mt-2 ml-4 list-disc">
                            <li><strong>ページをリロード:</strong> Ctrl+F5 (Windows) / Cmd+Shift+R (Mac) で強制リロード</li>
                            <li><strong>ブラウザキャッシュをクリア:</strong> 設定からブラウザキャッシュを削除</li>
                            <li><strong>プライベートブラウジング:</strong> シークレットモードで開き直し</li>
                        </ul>
                    </div>
                </div>
                {/* スコアの正規化方法について section */}
                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
                        スコアの正規化方法について
                    </div>
                    <div className="collapse-content">
                        <p>
                            本サイトでは、<b>現在進行中のイベントの期間</b>を基準として、過去の類似イベント（近傍イベント）のスコアを調整しています。
                            これにより、開催期間が異なる過去のイベントでも、現在のイベントと比べやすくなります。
                            例えば、現在のイベントが7.25日で、過去の類似イベントが6.25日の場合は、
                            <b>正規化スコア = 過去のスコア × 7.25 / 6.25</b> のように、現在のイベント期間に合わせてスコアを調整します。
                            <br />
                            <br />
                            ※ブーストの開始タイミングもイベント期間に合わせて調整しています（詳細な計算方法についてはここでは触れません）。
                            そのため、近傍イベントグラフに表示されている過去イベントのブースト開始時間も、現在のイベントに合わせて調整されています。
                        </p>
                    </div>
                </div>

                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
                        データ提供元・不具合報告
                    </div>
                    <div className="collapse-content">
                        <p>
                            ボーダーデータおよびアイドル画像は、
                            <a href="https://www.matsurihi.me/" target="_blank" rel="noopener noreferrer" className="link link-primary">
                            https://www.matsurihi.me
                            </a> より取得しています。
                            <br />不具合や改善点にお気づきの方は、
                            <a href="https://marshmallow-qa.com/mv4om4pbdffcxqe?t=S6VByN&utm_medium=url_text&utm_source=promotion"
                                target="_blank"
                                className="link link-primary">
                                    マシュマロから
                            </a>
                            お気軽にメッセージをお送りください。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
