// Safety-line ladder colors, resolved from the active DaisyUI theme so they
// always match (light/dark/seasonal) instead of hardcoded RGB. Semantic
// mapping: cooler/lower levels use info/success, higher/stricter levels ramp
// toward warning/error -- consistent with DaisyUI's own risk-color convention.
import { getDaisyUIColor } from './daisyui';

const SAFETY_CLASS_BY_LEVEL: Record<number, string> = {
  70: 'bg-info',
  75: 'bg-success',
  80: 'bg-warning',
  85: 'bg-warning',
  90: 'bg-error',
};

const FALLBACK_CLASS = 'bg-neutral';

/** Cache resolved colors per theme so we don't hit the DOM on every call. */
const cache = new Map<string, string>();

export function safetyColor(level: number, theme?: string): string {
  const key = `${theme ?? ''}:${level}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const cls = SAFETY_CLASS_BY_LEVEL[level] ?? FALLBACK_CLASS;
  const color = getDaisyUIColor(cls);
  cache.set(key, color);
  return color;
}

/** Clears the resolved-color cache; call when the theme changes. */
export function clearSafetyColorCache(): void {
  cache.clear();
}
