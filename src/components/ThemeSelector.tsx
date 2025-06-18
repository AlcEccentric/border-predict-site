import React, { useState } from 'react';
import { Palette } from 'lucide-react';

const themes = [
    { name: 'cupcake', color: '#EFEAE6', jp: 'カップケーキ' },
    { name: 'dim', color: '#242933', jp: 'ディム' },
    { name: 'nord', color: '#5E81AC', jp: 'ノルド' },
    { name: 'halloween', color: '#FF865B', jp: 'ハロウィン' },
    { name: 'sunset', color: '#fdba74', jp: 'サンセット' },
    { name: 'synthwave', color: '#E779C1', jp: 'シンセウェーブ' },
];

const ThemeSelector: React.FC<{
    theme: string;
    setTheme: (theme: string) => void;
}> = ({ theme, setTheme }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                className="btn btn-circle"
                onClick={() => setOpen(!open)}
                title="テーマを選択"
            >
                <Palette size={24} />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-96 bg-base-100 shadow-lg rounded-lg p-2 z-50">
                    <div className="grid grid-cols-2 gap-2">
                        {themes.map(t => (
                            <button
                                key={t.name}
                                className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-base-200 ${theme === t.name ? 'ring-2 ring-primary' : ''}`}
                                onClick={() => {
                                    setTheme(t.name);
                                    document.documentElement.setAttribute('data-theme', t.name);
                                    localStorage.setItem('theme', t.name);
                                    setOpen(false);
                                }}
                            >
                                <span
                                    className="inline-block w-5 h-5 rounded-full border border-gray-400"
                                    style={{
                                        background: t.color,
                                        minWidth: '1.25rem',
                                        minHeight: '1.25rem',
                                    }}
                                />
                                <span className="whitespace-nowrap">{t.jp}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemeSelector;