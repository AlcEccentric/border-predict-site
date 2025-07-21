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
    if (eventType === 3 && typeof internalEventType === 'number' && normalInternalTypes.includes(internalEventType)) {
        normalBlock = (
            <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">同種イベントの予測精度検証結果</h4>
                <p className="text-sm mb-2">
                    100位・2500位ボーダーの予測精度は、<b>過去16回分の同種イベント</b>（現在のイベントと類似パターンと判断したもの）を用いてKNN法で検証した結果に基づいています。イベント進行度が高くなるほど精度が向上します。
                </p>
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
                <div className="mt-6">
                    <p className="text-sm mb-2">
                        一部イベントでは、参加者の行動パターンや特殊なスコア推移により予測誤差が大きくなる場合があります。
                        特にイベント終盤までスコアが急激に伸びる場合や、途中で大きな変動がある場合は注意が必要です。
                    </p>
                </div>
            </div>
        );
    }
    return (
        <div className="mt-4">
            <h2 className="text-2xl font-bold mb-4">解説</h2>
            <div className="space-y-4">
                {/* ...existing code... */}
                <div className="collapse collapse-plus bg-base-200" id="prediction-accuracy">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
                        予測精度について
                    </div>
                    <div className="collapse-content">
                        <p>
                            予測精度はイベント形式によって異なります。以下は検証結果に基づく精度の目安です。
                        </p>
                        {anniversaryBlock}
                        {normalBlock}
                        {!anniversaryBlock && !normalBlock && defaultBlock}
                        <p className="mt-4 text-sm">
                            <strong>注意:</strong> 予測精度はイベント形式や参加者の行動パターンによって変動する可能性があります。
                            あくまで参考程度にご利用ください。
                        </p>
                    </div>
                </div>

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

                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
                        スコアの正規化方法について
                    </div>
                    <div className="collapse-content">
                        <p>
                            本サイトでは<b>7.25日</b>を標準イベント長とみなし、すべてのイベントスコアをこの長さに正規化しています。最も多くのイベントがこの長さなので、他の長さのイベントでも7.25日のデータを活用できます。
                            <br />
                            例えば6.25日のイベントの場合、<b>正規化スコア = 元のスコア × 7.25 / 6.25</b> で7.25日に合わせてスコアを変換します。
                            <br />
                            逆に、正規化された予測値を元のイベント長に戻すには <b>元のスコア = 正規化予測値 × 6.25 / 7.25</b> で元の長さに戻します。
                            <br />
                            ※詳細なサンプリングや補間は省略していますが、ブースト開始タイミングも標準化比率に合わせて調整しています。
                        </p>
                        <p className="mt-2">
                            <strong>補足:</strong> 周年イベントは全て同じ開催日数のため、正規化後も最終スコアは実際のスコアと一致します。
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
