import { Component, input } from '@angular/core';
import uPlot from 'uplot';
import { AdaptedFrame, UplotOptionsContributor } from 'angular-uplot';

/**
 * A custom visualization type that doesn't live in the library - proves UplotOptionsContributor
 * is a real extension point, not just an internal implementation detail. Renders one field as
 * bars (uPlot's built-in bars path builder) instead of a line.
 */
@Component({
  selector: 'uplot-bar-series',
  providers: [{ provide: UplotOptionsContributor, useExisting: UplotBarSeries }],
  template: '',
})
export class UplotBarSeries extends UplotOptionsContributor {
  readonly field = input.required<string>();
  readonly color = input<string>();

  override contribute(options: uPlot.Options, adapted: AdaptedFrame): uPlot.Options {
    const fieldIdx = adapted.fields.findIndex((f) => f.key === this.field());
    if (fieldIdx === -1) return options;
    const seriesIdx = fieldIdx + 1;

    const series = [...(options.series ?? [])];
    series[seriesIdx] = {
      ...series[seriesIdx],
      ...(this.color() != null ? { stroke: this.color(), fill: this.color() } : {}),
      paths: uPlot.paths.bars!({ size: [0.6, 100] }),
      points: { show: false },
    };

    return { ...options, series };
  }
}
