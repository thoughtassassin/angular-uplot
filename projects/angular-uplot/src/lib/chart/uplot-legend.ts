import { Component, computed, input } from '@angular/core';
import uPlot from 'uplot';

/** Declares the legend for a <uplot-chart>. Defaults to visible, with markers colored to match each series' stroke. */
@Component({ selector: 'uplot-legend', imports: [], template: '' })
export class UplotLegend {
  readonly show = input(true);

  readonly config = computed<Partial<uPlot.Legend>>(() => ({
    show: this.show(),
    live: false,
    markers: {
      width: 0,
      fill: (u, seriesIdx) => {
        const s = u.series[seriesIdx];
        const stroke = typeof s.stroke === 'function' ? s.stroke(u, seriesIdx) : s.stroke;
        return (stroke as string) ?? '';
      },
    },
  }));
}
