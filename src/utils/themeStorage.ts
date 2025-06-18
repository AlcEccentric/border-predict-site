export const saveTheme = (theme: string) => {
    try {
        localStorage.setItem('preferred-theme', theme);
    } catch (error) {
        console.error('Failed to save theme to localStorage:', error);
    }
};

export const loadTheme = (): string => {
    try {
        const savedTheme = localStorage.getItem('preferred-theme');
        return savedTheme || 'cupcake'; // Default theme if none is saved
    } catch (error) {
        console.error('Failed to load theme from localStorage:', error);
        return 'cupcake'; // Fallback to default theme
    }
};