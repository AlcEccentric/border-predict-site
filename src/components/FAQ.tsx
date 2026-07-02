import React from 'react';
import { Info, TrendingUp, Users, RefreshCw, Sliders, Heart, FlaskConical, type LucideIcon } from 'lucide-react';

interface FAQProps {
    /** Event type of the page this FAQ is rendered on. 5 = anniversary (周年). */
    eventType?: number;
}

type Section = {
    id?: string;
    title: string;
    icon: LucideIcon;
    defaultOpen?: boolean;
    /** Warning-styled instead of the default primary style; used to call
     * out experimental/in-progress changes so they're hard to miss. */
    highlight?: boolean;
    content: React.ReactNode;
};

/**
 * Build the FAQ sections for the given event kind. Anniversary (type 5)
 * events differ from normal events in several ways (per-idol predictions,
 * popularity-tiered confidence intervals, borders 100/1000 instead of
 * 100/2500), so the affected sections branch on `isAnniversary`.
 */
const getSections = (isAnniversary: boolean): Section[] => [
    {
        title: '予測について',
        icon: Info,
        content: isAnniversary ? (
            <>
                <p>
                    予測値は過去の類似イベントデータをもとに算出していますが、実際の結果とは異なる場合があります。参考情報としてご利用ください。
                </p>
                <p className="mt-2">
                    周年イベントでは、52人のアイドルそれぞれについて、<strong>100位・1000位</strong>のボーダーを個別に予測します。
                </p>
                <p className="mt-2">
                    <strong>予測の流れ:</strong><br />
                    1. 各アイドルの現在のスコアを正規化し、過去の周年イベントのスコア推移と比較して近傍を選定<br />
                    2. 近傍のスコア推移を現在の傾向に合わせて調整<br />
                    3. 類似度に応じて重み付けし、予測値を算出
                </p>
            </>
        ) : (
            <>
                <p>
                    予測値は過去の類似イベントデータをもとに算出していますが、実際の結果とは異なる場合があります。参考情報としてご利用ください。
                </p>
                <p className="mt-2">
                    <strong>予測の流れ:</strong><br />
                    1. 現在のイベントデータを正規化し、過去のイベントと比較して近傍イベントを選定<br />
                    2. 近傍イベントのスコア推移を現在の傾向に合わせて調整<br />
                    3. 類似度に応じて重み付けし、複数イベントから予測値を算出
                </p>
            </>
        ),
    },
    {
        id: 'prediction-accuracy',
        title: '予測精度について',
        icon: TrendingUp,
        content: (
            <>
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
                {isAnniversary && (
                    <div className="mt-4">
                        <h4 className="text-lg font-semibold mb-2">人気帯に応じた信頼区間</h4>
                        <p className="text-sm">
                            周年イベントでは、アイドルが「イベント内でどのくらいの順位帯（人気帯）にいるか」に応じて信頼区間の幅が変わります。
                        </p>
                        <ul className="ml-4 mt-2 list-disc text-sm">
                            <li>人気が高いアイドルほど予測が安定しやすく、範囲は<strong>狭く</strong>なります。</li>
                            <li>人気が低いアイドルは予測が難しく、範囲は<strong>広く</strong>なります。</li>
                        </ul>
                        <p className="mt-2 text-sm text-base-content/70">
                            → 同じイベントでも、表示されるアイドルによって信頼区間の幅が異なるのはこのためです。
                        </p>
                    </div>
                )}
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
                            {isAnniversary && (
                                <span className="block mt-1 text-base-content/70">
                                    ※周年イベントでは、アイドルの人気帯（順位帯）ごとに誤差の分布を分けて計算しています。
                                </span>
                            )}
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
                    <strong>注意:</strong> 信頼区間はあくまで過去データに基づく推定値です。
                    参加者の行動や特殊な状況によっては、実際の結果が範囲外になることもあります。
                </p>
            </>
        ),
    },
    {
        title: '近傍イベントとは',
        icon: Users,
        content: isAnniversary ? (
            <p>
                近傍イベントとは、現在進行中の周年イベントと「スコアの伸び方（特に現在の進行度付近）」が類似している過去の周年イベントのことです。<br />
                周年イベントでは<strong>アイドルごと</strong>に近傍を選定し、それぞれのスコア推移を参照して予測します。<br />
                同じ形式・同じ開催期間のイベントであれば、ボーダーライン（100位や1000位など）の伸び方も似てくる傾向があるため、より正確な予測に繋がります。<br />
                <br />
                <span className="text-base-content/70">
                    ※以前は選ばれた近傍イベントをグラフに表示していましたが、アルゴリズムの更新により、選ばれる近傍は「スコアの伸び方の形」を重視するようになりました。そのため、見た目の直感で「近い」と感じるイベントとは必ずしも一致しないことがあり、現在は表示していません。
                </span>
            </p>
        ) : (
            <p>
                近傍イベントとは、現在進行中のイベントと「イベント形式」や「スコアの伸び方（特に現在の進行度付近）」などが類似している過去のイベントのことです。<br />
                これらのイベントのスコア推移を比較・参照することで、現在のイベントが今後どのように進行するかを予測する材料になります。<br />
                特に同じ形式・同じ開催期間のイベントであれば、ボーダーライン（100位や2500位など）の伸び方も似てくる傾向があるため、より正確な予測に繋がります。<br />
                <br />
                <span className="text-base-content/70">
                    ※以前は選ばれた近傍イベントをグラフに表示していましたが、アルゴリズムの更新により、選ばれる近傍は「スコアの伸び方の形」を重視するようになりました。そのため、見た目の直感で「近い」と感じるイベントとは必ずしも一致しないことがあり、現在は表示していません。
                </span>
            </p>
        ),
    },
    // Experimental change specific to Type 5 border-100. Kept brief on
    // purpose — only the observation and "we're working on it" — since the
    // actual fix/solution isn't finalized yet. Expand with details once
    // it's settled.
    ...(isAnniversary ? [{
        title: '今回の仕様変更による影響について',
        icon: FlaskConical,
        highlight: true,
        content: (
            <p className="text-sm">
                今回のイベントでは、スキップパスの導入に加え、DX+パス購入者がオートパスを無制限に追加購入できる仕様変更が行われています。
                現時点では、スキップパスの影響により序盤のスコアがやや高く推移している可能性があり、
                またDX+パスについてもプレイ回数の増加につながる可能性がありますが、現時点では明確な因果関係は確認されていません。
                引き続きデータを観察しながら、必要に応じて予測モデルの調整を行います。
                今後数日間は予告なく予測結果が変わる場合がありますので、あらかじめご了承ください。
            </p>
        ),
    }] : []),
    {
        title: 'データ更新頻度と古いデータについて',
        icon: RefreshCw,
        content: (
            <>
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
            </>
        ),
    },
    {
        title: 'スコアの正規化方法について',
        icon: Sliders,
        content: isAnniversary ? (
            <p>
                本サイトでは、<b>現在進行中のイベントの期間</b>を基準として、過去の類似イベント（近傍イベント）のスコアを調整しています。
                周年イベントは通常<b>約13日間</b>で開催されますが、過去のイベントと開催期間がわずかに異なる場合は、現在のイベント期間に合わせてスコアを調整します。
                これにより、開催期間が異なる過去のイベントでも、現在のイベントと比べやすくなります。
                <br />
                <br />
                ※ブーストの開始タイミング（折り返し）もイベント期間に合わせて調整しています（詳細な計算方法についてはここでは触れません）。
            </p>
        ) : (
            <p>
                本サイトでは、<b>現在進行中のイベントの期間</b>を基準として、過去の類似イベント（近傍イベント）のスコアを調整しています。
                これにより、開催期間が異なる過去のイベントでも、現在のイベントと比べやすくなります。
                例えば、現在のイベントが7.25日で、過去の類似イベントが6.25日の場合は、
                <b>正規化スコア = 過去のスコア × 7.25 / 6.25</b> のように、現在のイベント期間に合わせてスコアを調整します。
                <br />
                <br />
                ※ブーストの開始タイミングもイベント期間に合わせて調整しています（詳細な計算方法についてはここでは触れません）。
            </p>
        ),
    },
    {
        title: 'データ提供元・不具合報告',
        icon: Heart,
        content: (
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
        ),
    },
];

const FAQ: React.FC<FAQProps> = ({ eventType }) => {
    const isAnniversary = eventType === 5;
    const sections = getSections(isAnniversary);

    return (
        <div className="mt-4">
            <div className="space-y-3">
                {sections.map(({ id, title, icon: Icon, defaultOpen, highlight, content }) => (
                    <div
                        key={title}
                        id={id}
                        className={`collapse collapse-plus ${highlight ? 'bg-warning/10 border border-warning/30' : 'bg-base-200'}`}
                    >
                        <input type="checkbox" defaultChecked={defaultOpen} />
                        <div
                            className={`collapse-title text-lg font-bold px-4 py-3 border-l-4 flex items-center gap-3 ${
                                highlight
                                    ? 'bg-gradient-to-r from-warning/20 to-transparent border-warning'
                                    : 'bg-gradient-to-r from-primary/10 to-transparent border-primary'
                            }`}
                        >
                            <Icon size={20} className={`shrink-0 ${highlight ? 'text-warning' : 'text-primary'}`} />
                            <span>{title}</span>
                        </div>
                        <div className="collapse-content">
                            {content}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQ;
