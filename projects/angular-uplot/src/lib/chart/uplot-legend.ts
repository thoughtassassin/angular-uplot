import { Component, input } from '@angular/core';
import uPlot from 'uplot';
import { UplotOptionsContributor } from './uplot-options-contributor';

/** Declares the legend for a <uplot-chart>. Defaults to visible, with markers colored to match each series' stroke. */
@Component({
  selector: 'uplot-legend',
  imports: [],
  template: '',
  providers: [{ provide: UplotOptionsContributor, useExisting: UplotLegend }],
})
export class UplotLegend extends UplotOptionsContributor {
  readonly show = input(true);

  override contribute(options: uPlot.Options): uPlot.Options {
    return {
      ...options,
      legend: {
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
      },
    };
  }
}
