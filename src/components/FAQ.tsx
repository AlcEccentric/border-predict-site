import React from 'react';

interface FAQProps {
    eventType: number;
    internalEventType: number;
}

const FAQ: React.FC<FAQProps> = ({ eventType, internalEventType }) => {
    // List of internal event types for normal event precision
    const normalInternalTypes = [18];

    // Precision blocks
    let anniversaryBlock = null;
    let normalBlock = null;
    let type42KnnBlock = null;
    let type33KnnBlock = null;
    let defaultBlock = (
        <div className="mt-4">
            <h4 className="text-lg font-semibold mb-2">通常イベント</h4>
            <p className="text-sm text-base-content/70">
                通常イベントの予測精度データは現在収集・検証中です。
            </p>
        </div>
    );
    if (eventType === 5 && internalEventType === 5) {
        anniversaryBlock = (
            <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">周年イベント（7周年での検証結果）</h4>
                <p className="text-sm mb-2">
                    7周年のデータを用いた検証結果に基づく予測精度の目安です。
                    イベントの進行度に応じて精度が向上する傾向があります。
                </p>
                <div className="ml-4">
                    <p className="mt-2">
                        <strong>100位ボーダー:</strong>
                        <br />• イベント序盤（10-29%）: ±10%誤差範囲の的中率 48-69%、±5%誤差範囲 19-35%
                        <br />• イベント中盤（30-69%）: ±10%誤差範囲の的中率 75-85%、±5%誤差範囲 38-54%
                        <br />• イベント後半（70-79%）: ±10%誤差範囲の的中率 80-92%、±5%誤差範囲 50-58%
                        <br />• イベント終盤（80-89%）: ±10%誤差範囲の的中率 94-100%、±5%誤差範囲 60-75%
                        <br />• イベント最終盤（90-97%）: ±10%誤差範囲の的中率 100%、±5%誤差範囲 78-98%（具体的には、進行が90%の時点で78%、93%で90%、96%で98%に達します）
                    </p>
                    <p className="mt-2">
                        <strong>1000位ボーダー:</strong>
                        <br />• ±10%誤差範囲の的中率は90%以前で約80%、90%以降で90%
                        <br />• ±5%誤差範囲の的中率は90%以前で60-70%、90%以降で80%
                    </p>
                </div>
                <div className="mt-6">
                    <h5 className="text-md font-semibold mb-2">アイドル別の予測精度について</h5>
                    <p className="text-sm mb-2">
                        一部のアイドルでは他のアイドルと比較して予測精度が低い場合があります。
                        以下は7周年データでの検証結果に基づく、特に注意が必要なアイドルの傾向です。
                    </p>
                    <div className="mt-4">
                        <h6 className="text-sm font-semibold mb-2">±10%誤差範囲を外れやすいアイドル</h6>
                        <div className="ml-4">
                            <p className="mt-2">
                                <strong>100位ボーダー:</strong>
                                <br />• <span className="text-warning">双海真美、双海亜美、島原エレナ</span>
                                <br />• 特にイベント75%進行時点以降で±10%誤差範囲を外れやすくなります
                                <br />• ただし、イベント90%進行時点以降では全アイドルで±10%誤差範囲内に収まります
                            </p>
                            <p className="mt-2">
                                <strong>1000位ボーダー:</strong>
                                <br />• <span className="text-warning">福田のり子、舞浜歩、島原エレナ、双海亜美、双海真美</span>
                                <br />• スコアデータがイベント終盤まで0のままで推移するため、予測精度が低くなります
                                <br />• これらのアイドルでは±10%誤差範囲を外れる可能性が高くなります
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h6 className="text-sm font-semibold mb-2">±5%誤差範囲を外れやすいアイドル</h6>
                        <div className="ml-4">
                            <p className="mt-2">
                                <strong>100位ボーダー:</strong>
                            </p>
                            <div className="ml-4">
                                <p className="mt-1">
                                    <span className="text-error">特に注意が必要なアイドル:</span>
                                    <br />• <span className="text-error">島原エレナ、北上麗花</span>
                                    <br />• イベント全期間を通して±5%誤差範囲を外れやすく、予測誤差が大きくなる傾向があります
                                    <br />• ただし、イベント90%進行時点以降では予測誤差が5%以下に縮小されます
                                </p>
                                <p className="mt-1">
                                    <span className="text-warning">中盤以降で注意が必要なアイドル:</span>
                                    <br />• <span className="text-warning">双海真美、双海亜美、舞浜歩、福田のり子、周防桃子</span>
                                    <br />• イベント中盤（30-79%）で±5%誤差範囲を外れやすくなります
                                    <br />• しかし、イベント終盤（80%以降）では予測誤差が5%以下に縮小されます
                                </p>
                            </div>
                            <div className="mt-3 p-3 bg-success/20 rounded-lg">
                                <p className="text-success text-sm">
                                    上記以外のアイドルでは±5%誤差範囲内に収まる確率が比較的高く、
                                    イベント中盤（30%以降）で70-80%、終盤（80%以降）では85-90%、
                                    最終盤（90%以降）では90%の確率で±5%誤差範囲内に収まります。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (eventType === 4 && typeof internalEventType === 'number' && [22, 23].includes(internalEventType)) {
        type42KnnBlock = (
            <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">ツアービンゴ・ツアービンゴスペシャル（KNN法での検証結果）</h4>
                <p className="text-sm mb-2">
                    100位・2500位ボーダーの予測精度は、<b>過去13回分の同種のイベント</b>を用いてKNN法で検証した結果に基づいています。イベント進行度が高くなるほど精度が向上します。
                </p>
                <div className="p-3 mb-2 bg-success/20 rounded-lg">
                    <p className="text-success text-sm">
                        <strong>要点:</strong> 100位は進行度85%(残り26時間ほど)付近で高い確率(約90%)で±10%誤差範囲内に収まり、2500位は80%(残り35時間ほど)付近で高い確率(約90%)で±10%誤差範囲内に収まります。
                    </p>
                </div>
                
                <div className="ml-4">
                    <p className="mt-2">
                        <strong>100位ボーダー:</strong>
                        <br />• イベント序盤（20-39%）: ±10%誤差範囲の的中率 36-45%、±5%誤差範囲 9-27%
                        <br />• イベント中盤（40-69%）: ±10%誤差範囲の的中率 45-72%、±5%誤差範囲 27-63%
                        <br />• イベント後半（70-79%）: ±10%誤差範囲の的中率 72-81%、±5%誤差範囲 36-63%
                        <br />• イベント終盤（80-89%）: ±10%誤差範囲の的中率 81-100%、±5%誤差範囲 54-72%
                        <br />• イベント最終盤（90-97%）: ±10%誤差範囲の的中率 100%、±5%誤差範囲 100%
                    </p>
                    
                    <p className="mt-2">
                        <strong>2500位ボーダー:</strong>
                        <br />• イベント序盤（20-39%）: ±10%誤差範囲の的中率 64-73%、±5%誤差範囲 27-45%
                        <br />• イベント中盤（40-69%）: ±10%誤差範囲の的中率 73-91%、±5%誤差範囲 36-55%
                        <br />• イベント後半（70-79%）: ±10%誤差範囲の的中率 73-100%、±5%誤差範囲 45-82%
                        <br />• イベント終盤（80-89%）: ±10%誤差範囲の的中率 100%、±5%誤差範囲 82-100%
                        <br />• イベント最終盤（90-97%）: ±10%誤差範囲の的中率 100%、±5%誤差範囲 100%
                    </p>
                </div>
                <div className="mt-6">
                    <p className="text-sm mb-2">
                        この種類のイベントでは、イベント中盤以降で予測精度が大幅に向上する傾向があります。
                        2500位は100位よりも早期（80%付近）から高い精度を示し、安定した予測が可能です。
                    </p>
                </div>
            </div>
        );
    }
    if (eventType === 3 && typeof internalEventType === 'number' && [3].includes(internalEventType)) {
        type33KnnBlock = (
            <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">シアター・シアタースペシャルの検証結果</h4>
                <p className="text-sm mb-2">
                    100位・2500位ボーダーの予測精度は、<b>過去12回分の同種イベント</b>を用いて検証した結果に基づいています。イベント進行度が高くなるほど精度が向上します。
                </p>
                <div className="p-3 mb-2 bg-error/20 rounded-lg">
                    <p className="text-error text-sm mb-2">
                        <strong>重要な注意:</strong> シアター・シアタースペシャルは近年開催頻度が低く、過去には多数開催されていましたが、古いイベントのスコア推移パターンは最近のものと大きく異なるため、他のイベント形式より精度が低いです。
                    </p>
                    <p className="text-error text-sm">
                        特に折り返し開始前（60%未満）の精度は低いため、参考程度にご利用ください。
                    </p>
                </div>
                
                <div className="ml-4">
                    <p className="mt-2">
                        <strong>100位ボーダー:</strong>
                        <br />• イベント序盤（20-39%）: ±10%誤差範囲の的中率 20%、±5%誤差範囲 10-20%
                        <br />• イベント中盤（40-69%）: ±10%誤差範囲の的中率 40-60%、±5%誤差範囲 10-50%
                        <br />• イベント後半（70-79%）: ±10%誤差範囲の的中率 40-70%、±5%誤差範囲 50-60%
                        <br />• イベント終盤（80-97%）: ±10%誤差範囲の的中率 80-100%、±5%誤差範囲 60-70%
                    </p>
                    
                    <p className="mt-2">
                        <strong>2500位ボーダー:</strong>
                        <br />• イベント序盤（20-39%）: ±10%誤差範囲の的中率 43-64%、±5%誤差範囲 14-29%
                        <br />• イベント中盤（40-69%）: ±10%誤差範囲の的中率 43-78%、±5%誤差範囲 21-50%
                        <br />• イベント後半（70-79%）: ±10%誤差範囲の的中率 64-78%、±5%誤差範囲 29-50%
                        <br />• イベント終盤（80-97%）: ±10%誤差範囲の的中率 78-92%、±5%誤差範囲 50-71%
                    </p>
                </div>
            </div>
        );
    }
    if (eventType === 3 && typeof internalEventType === 'number' && normalInternalTypes.includes(internalEventType)) {
        normalBlock = (
            <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">同種イベントの予測精度検証結果</h4>
                <p className="text-sm mb-2">
                    100位・2500位ボーダーの予測精度は、<b>過去16回分の同種イベント</b>（現在のイベントと類似パターンと判断したもの）を用いてKNN法で検証した結果に基づいています。イベント進行度が高くなるほど精度が向上します。
                </p>
                <div className="p-3 mb-2 bg-success/20 rounded-lg">
                    <p className="text-success text-sm">
                        <strong>要点: 100位は進行度80%付近で高い確率(約90%)で±10%誤差範囲内に収まり、2500位は85%付近で高い確率(約90%)で±10%誤差範囲内に収まります。</strong>
                    </p>
                </div>
                
                <div className="ml-4">
                    <p className="mt-2">
                        <strong>100位ボーダー:</strong>
                        <br />• イベント序盤（20-39%）: ±10%誤差範囲の的中率 18-40%、±5%誤差範囲 12-14%
                        <br />• イベント中盤（40-69%）: ±10%誤差範囲の的中率 40-81%、±5%誤差範囲 14-50%
                        <br />• イベント後半（70-79%）: ±10%誤差範囲の的中率 81-87%、±5%誤差範囲 50-62%
                        <br />• イベント終盤（80-89%）: ±10%誤差範囲の的中率 87-93%、±5%誤差範囲 62-68%
                        <br />• イベント最終盤（90-97%）: ±10%誤差範囲の的中率 93-100%、±5%誤差範囲 68-82%
                    </p>
                    
                    <p className="mt-2">
                        <strong>2500位ボーダー:</strong>
                        <br />• イベント序盤（20-39%）: ±10%誤差範囲の的中率 62-68%、±5%誤差範囲 18-31%
                        <br />• イベント中盤（40-69%）: ±10%誤差範囲の的中率 43-68%、±5%誤差範囲 18-37%
                        <br />• イベント後半（70-79%）: ±10%誤差範囲の的中率 68-75%、±5%誤差範囲 37-43%
                        <br />• イベント終盤（80-89%）: ±10%誤差範囲の的中率 75-93%、±5%誤差範囲 37-62%
                        <br />• イベント最終盤（90-97%）: ±10%誤差範囲の的中率 93-100%、±5%誤差範囲 62-82%
                    </p>
                    <div className="mt-2 p-2 bg-warning/20 rounded text-warning text-sm">
                        ※2500位はブーストに特に敏感で、ブースト付近（イベント中盤40-69%）では予測精度がイベント序盤より悪化する傾向があります。
                    </div>
                </div>
            </div>
        );
    }
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
                        データソース・不具合報告
                    </div>
                    <div className="collapse-content">
                        <p>
                            ボーダーデータおよびアイドル画像は、
                            <a href="https://www.matsurihi.me/" target="_blank" rel="noopener noreferrer" className="link link-primary">
                            https://www.matsurihi.me
                            </a> より取得しています。
                        </p>
                        <p className="mt-2">
                            <strong>ベータ版について:</strong>
                            <br />このサイトは現在ベータ版として公開されており、テスト段階にあります。
                            予測精度の向上や機能の改善を継続的に行っています。
                            また、ウェブサイト自体にもバグや改善すべき点が存在する可能性があります。
                            不具合や改善点にお気づきの場合は、お気軽にご連絡ください。
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
