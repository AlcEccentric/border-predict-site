import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const themes = [
    { name: 'cupcake', emoji: '🧁', label: 'カップケーキ' },
    { name: 'valentine', emoji: '💝', label: 'バレンタイン' },
    { name: 'halloween', emoji: '🎃', label: 'ハロウィン' },
    { name: 'aqua', emoji: '💧', label: 'アクア' },
    { name: 'caramel', emoji: '🍯', label: 'キャラメル' },
    { name: 'nord', emoji: '❄️', label: 'ノルド' },
    { name: 'lemonade', emoji: '🍋', label: 'レモネード' }
];

const ThemeSelector: React.FC = () => {
    const { currentTheme, setTheme } = useTheme();

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-circle m-1">
                {themes.find(t => t.name === currentTheme)?.emoji || '🎨'}
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                {themes.map((theme) => (
                    <li key={theme.name}>
                        <a 
                            onClick={() => setTheme(theme.name)}
                            className={`${currentTheme === theme.name ? 'active' : ''}`}
                        >
                            <span className="flex items-center gap-2">
                                {theme.emoji} {theme.label}
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
            
            {/* Debug info */}
            <div className="text-sm">
                <p>Current theme: {currentTheme}</p>
                <p>HTML data-theme: {document.documentElement.getAttribute('data-theme')}</p>
            </div>
        </div>
    );
};

export default ThemeSelector;