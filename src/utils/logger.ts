/**
 * Console logger gated on the dev-only `VITE_DEBUG` flag (set by
 * `npm run dev:debug`). In production builds, the constant is `false` and
 * the call sites compile to no-ops, which Vite/Rollup tree-shakes out.
 *
 * Usage:
 *   import { log } from '../utils/logger';
 *   log.info('hello', someValue);
 *   log.warn('something off', err);
 *   log.error('fatal', err);
 */
const DEBUG_ENABLED =
    import.meta.env.VITE_DEBUG === '1' || import.meta.env.VITE_DEBUG === 'true';

const noop = (..._args: unknown[]) => undefined;

export const log = {
    info: DEBUG_ENABLED ? console.log.bind(console) : noop,
    warn: DEBUG_ENABLED ? console.warn.bind(console) : noop,
    error: DEBUG_ENABLED ? console.error.bind(console) : noop,
};
