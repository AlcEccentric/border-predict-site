import React from 'react';

/**
 * Site-wide footer: IP attribution, data-source credit, and a liability
 * disclaimer. This is a fan-made, unofficial tool, so it's important to be
 * clear about copyright ownership and that predictions are estimates.
 */
const Footer: React.FC = () => {
    return (
        <footer className="mt-8 border-t border-base-300 py-6 px-4">
            <div className="container mx-auto max-w-3xl text-center text-xs leading-relaxed text-base-content/60 space-y-2">
                <p>© 2025–2026 Yueni</p>
                <p>
                    「アイドルマスター」関連コンテンツの著作権は、窪岡俊之氏および株式会社バンダイナムコエンターテインメントに帰属します。
                    本サイトはファンが運営する非公式ツールであり、権利者および関連企業とは一切関係ありません。
                </p>
                <p>
                    ボーダーデータおよびアイドル画像は{' '}
                    <a
                        href="https://www.matsurihi.me/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link"
                    >
                        matsurihi.me
                    </a>{' '}
                    より取得しています。
                </p>
                <p>
                    本サイトが提供する予測は、過去のデータに基づく推定値です。正確性・信頼性・完全性を保証するものではありません。
                    また、本サイトの情報の利用により生じたいかなる損害についても責任を負いません。
                </p>
            </div>
        </footer>
    );
};

export default Footer;
