// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadTheme, saveTheme } from '../utils/themeStorage';

interface ThemeContextType {
    currentTheme: string;
    setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// src/contexts/ThemeContext.tsx
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(() => loadTheme());

    const setTheme = (theme: string) => {
        setCurrentTheme(theme);
        saveTheme(theme);
        
        // More forceful theme application
        const html = document.documentElement;
        html.setAttribute('data-theme', theme);
        
        // Force a repaint
        html.style.display = 'none';
        void html.offsetHeight; // trigger reflow
        html.style.display = '';
        
        // Also set as a class name for additional specificity
        html.className = `theme-${theme}`;
    };

    useEffect(() => {
        // Apply theme on mount
        setTheme(currentTheme);
    }, []);

    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};