import { formatRgb, oklch } from 'culori';

export const getDaisyUIColor = (className: string, fallback: string = 'rgb(244, 114, 182)'): string => {
  try {
    const tempElement = document.createElement('div');
    tempElement.className = className;
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    document.body.appendChild(tempElement);
    const computedStyle = getComputedStyle(tempElement);
    const color = computedStyle.backgroundColor;
    document.body.removeChild(tempElement);
    return color;
  } catch {
    return fallback;
  }
};

export const getColorWithAlpha = (color: string, alpha: number): string => {
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }
  try {
    const oklchColor = oklch(color);
    if (
      oklchColor &&
      typeof oklchColor.l === 'number' &&
      typeof oklchColor.c === 'number' &&
      typeof oklchColor.h === 'number'
    ) {
      return formatRgb({ ...oklchColor, alpha });
    }
    return `rgba(244, 114, 182, ${alpha})`;
  } catch {
    return `rgba(244, 114, 182, ${alpha})`;
  }
};
