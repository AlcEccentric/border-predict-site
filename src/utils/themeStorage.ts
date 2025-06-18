export const saveTheme = (theme: string) => {
    localStorage.setItem('preferred-theme', theme);
};

export const loadTheme = (): string => {
    return localStorage.getItem('preferred-theme') || 'cupcake';
};