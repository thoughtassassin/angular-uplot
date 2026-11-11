import { inject, InjectionToken } from '@angular/core';

/** Not a closed set - a consumer registers its own keys through `UPLOT_EXTRA_UNITS`. */
export type Unit = string;

export type UnitFormatter = (value: number) => string;

function formatBytes(v: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let n = v;
  let i = 0;
  while (Math.abs(n) >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}

function formatShort(v: number): string {
  const units = ['', 'K', 'M', 'B'];
  let n = v;
  let i = 0;
  while (Math.abs(n) >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return `${n.toFixed(n % 1 === 0 ? 0 : 1)}${units[i]}`;
}

export const defaultUnitFormatters: Record<string, UnitFormatter> = {
  none: (v) => v.toString(),
  percent: (v) => `${v.toFixed(1)}%`,
  bytes: formatBytes,
  short: formatShort,
};

/**
 * A consumer adds units here, each as its own provider (`multi: true`), so any number of
 * sources - the app, a shared component library - can register units without clobbering each
 * other or the built-ins:
 *
 *   { provide: UPLOT_EXTRA_UNITS, useValue: { 'bits-per-sec': formatBitsPerSec }, multi: true }
 */
/**
 * Each provider supplies one `Record<string, UnitFormatter>` (not wrapped in an array) via
 * `multi: true` - same convention as Angular's own `HTTP_INTERCEPTORS` - and injecting this
 * token elsewhere yields the array of all registrations.
 */
export const UPLOT_EXTRA_UNITS = new InjectionToken<Record<string, UnitFormatter>[]>('UPLOT_EXTRA_UNITS');

/**
 * Unit formatters available to `<uplot-axis>` and to anything else (a tooltip) that wants to
 * format the same values consistently - `defaultUnitFormatters` merged with every
 * `UPLOT_EXTRA_UNITS` registration.
 */
export const UPLOT_UNITS = new InjectionToken<Record<string, UnitFormatter>>('UPLOT_UNITS', {
  factory: () => {
    const extras = inject(UPLOT_EXTRA_UNITS, { optional: true }) ?? [];
    return extras.reduce((acc, units) => ({ ...acc, ...units }), { ...defaultUnitFormatters });
  },
});
