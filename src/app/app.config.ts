import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { UPLOT_EXTRA_UNITS } from 'angular-uplot';

import { routes } from './app.routes';

/**
 * Proves the unit registry is an open extension point, not a closed enum: a consumer app adds
 * its own units here, and both <uplot-axis> and the panel's tooltip pick them up automatically
 * since they resolve formatters through the same injected UPLOT_UNITS token.
 */
function formatBitsPerSec(v: number): string {
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  let n = v;
  let i = 0;
  while (Math.abs(n) >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return `${n.toFixed(n % 1 === 0 ? 0 : 1)} ${units[i]}`;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: UPLOT_EXTRA_UNITS, useValue: { 'bits-per-sec': formatBitsPerSec }, multi: true },
  ]
};
