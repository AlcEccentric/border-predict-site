import React from 'react';

const FAQ: React.FC = () => {
    return (
        <div className="mt-4">
            <h2 className="text-2xl font-bold mb-4">解説</h2>
            <div className="space-y-4">
                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
                        予測について
                    </div>
                    <div className="collapse-content">
                        <p>
                            予測値は過去の類似イベントデータを基に算出されており、実際の結果とは異なる場合があります。
                            予測結果は参考程度にご利用ください。
                        </p>
                        <p className="mt-2">
                            <strong>予測プロセス:</strong> 
                            <br />1. 現在のイベントの既知データを正規化し、過去のイベントの正規化された軌跡と比較して「近傍イベント」を特定
                            <br />2. 各近傍イベントとの距離に基づいて重みを計算
                            <br />3. 近傍イベントのスコア推移を現在のイベントの既知データに合わせて調整（アライメント）
                            <br />4. 事前に計算した重みを使用して、複数の近傍イベントから最終予測を算出
                        </p>
                        <p className="mt-2">
                            <strong>アライメント方法:</strong> 線形回帰、アフィン変換の2つの方法を用いて、
                            近傍イベントのスコア推移を現在のイベントの直近十数時間のトレンドに最適に合わせます。
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
                    <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
                        近傍イベントとは
                    </div>
                    <div className="collapse-content">
                        <p>
                            近傍イベントとは、現在進行中のイベントと「イベント形式」や「スコアの伸び方」などが類似している過去のイベントのことです。<br />
                            これらのイベントのスコア推移を比較・参照することで、現在のイベントが今後どのように進行するかを予測する材料になります。<br />
                            特に同じ形式・同じ開催期間のイベントであれば、ボーダーライン（100位や2500位など）の伸び方も似てくる傾向があるため、より正確な予測に繋がります。
                        </p>
                        <p className="mt-2">
                            <strong>近傍イベントの表示について:</strong><br />
                            「近傍1」は最も類似度の高い（距離が最も近い）イベント、「近傍2」は2番目に類似度の高いイベントを示します。<br />
                            数字が小さいほど現在のイベントとの類似度が高く、予測精度により大きく影響します。
                        </p>
                    </div>
                </div>

                <div className="collapse collapse-plus bg-base-200" id="prediction-accuracy">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
                        予測精度について
                    </div>
                    <div className="collapse-content">
                        <p>
                            予測精度はイベント形式によって異なります。以下は検証結果に基づく精度の目安です。
                        </p>
                        
                        <div className="mt-4 p-3 bg-warning/20 border-l-4 border-warning rounded-lg">
                            <p className="text-sm">
                                <strong>深夜帯（1:00-4:00 JST）の予測傾向について:</strong>
                                <br />20:00-2:00頃の急激なスコア上昇により、2:00頃の予測は高めに予測する傾向があります。
                                スムージング処理で軽減を図っていますが、予測精度に影響する可能性があります。
                            </p>
                        </div>
                        
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
                                    <br />• イベント最終盤（90-97%）: ±10%誤差範囲の的中率 100%、±5%誤差範囲 75-98%
                                </p>
                                <p className="mt-2">
                                    <strong>1000位ボーダー:</strong>
                                    <br />• ±10%誤差範囲の的中率は90%以前で約80%、90%以降で90%
                                    <br />• ±5%誤差範囲の的中率は90%以前で60-70%、90%以降で80%
                                </p>
                            </div>

                            <div className="mt-6">
                                <h5 className="text-md font-semibold mb-2">アイドル別の予測精度について</h5>                            <p className="text-sm mb-2">
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
                                                <br />• <span className="text-warning">双海真美、舞浜歩、福田のり子、周防桃子</span>
                                                <br />• イベント中盤（30-69%）以降で±5%誤差範囲を外れやすくなります
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
                                
                                <p className="mt-4 text-sm text-info">
                                    <strong>補足:</strong> 上記のアイドルの予測をご覧になる際は、特に注意して参考程度にご利用ください。
                                    なお、通常イベントでは異なる傾向を示す可能性があります。
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <h4 className="text-lg font-semibold mb-2">通常イベント</h4>
                            <p className="text-sm text-base-content/70">
                                通常イベントの予測精度データは現在収集・検証中です。
                            </p>
                        </div>
                        
                        <p className="mt-4 text-sm">
                            <strong>注意:</strong> 予測精度はイベント形式や参加者の行動パターンによって変動する可能性があります。
                            あくまで参考程度にご利用ください。
                        </p>
                    </div>
                </div>

                <div className="collapse collapse-plus bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
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
                    <div className="collapse-title text-xl font-bold bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-l-4 border-primary">
                        データ更新頻度と古いデータについて
                    </div>
                    <div className="collapse-content">
                        <p>
                            <strong>データ更新頻度:</strong>
                            <br />予測データは通常1~2時間ごとに更新されます。
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
                            イベントごとに開催日数やブースト開始タイミングが異なるため、本サイトではスコア推移を比較しやすくするために正規化処理を行っています。<br />
                            <b>現在のイベントと同じ長さの近傍イベント</b>はリサンプリングのみのため、表示スコアは実際の最終スコアと一致します。<br />
                            <b>異なる長さの近傍イベント</b>は、ブースト開始位置を同じ比率に合わせ、スコアも長さの比率でスケーリングしています。<br />
                            そのため、<b>正規化後のスコアは実際のスコアと異なる場合があります</b>。<br />
                            <span className="text-error font-bold">実際のボーダー推移を比較したい場合は、同じ開催日数のイベントを参照するのがおすすめです。</span>
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
                            <strong>データソース:</strong>
                            <br />ボーダーデータおよびアイドル画像は、
                            <a href="https://www.matsurihi.me/" target="_blank" rel="noopener noreferrer" className="link link-primary">
                                https://www.matsurihi.me
                            </a>
                            から提供されています。
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