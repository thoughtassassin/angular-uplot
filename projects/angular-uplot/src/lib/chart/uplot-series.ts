import { Component, contentChildren, input } from '@angular/core';
import uPlot from 'uplot';
import { AdaptedFrame } from '../data/data-adapter';
import { UplotConnectNulls } from './uplot-connect-nulls';
import { UplotOptionsContributor } from './uplot-options-contributor';

/**
 * Declares styling/behavior for one field of a <uplot-chart>'s data, matched by `field` key
 * against the adapter's field metadata - not by template position. Optional: a field with no
 * matching <uplot-series> just uses the adapter's own label/color (or a palette fallback),
 * seeded by <uplot-chart> itself before any contributor runs.
 */
@Component({
  selector: 'uplot-series',
  imports: [],
  template: '',
  providers: [{ provide: UplotOptionsContributor, useExisting: UplotSeries }],
})
export class UplotSeries extends UplotOptionsContributor {
  readonly field = input.required<string>();
  readonly label = input<string>();
  readonly color = input<string>();
  /** Line stroke width in px. Leave unset to use uPlot's own default. */
  readonly width = input<number>();
  /** Whether to render a point marker at each data value. Leave unset to use uPlot's own default. */
  readonly showPoints = input<boolean>();

  private readonly connectNulls = contentChildren(UplotConnectNulls);

  override contribute(options: uPlot.Options, adapted: AdaptedFrame): uPlot.Options {
    const fieldIdx = adapted.fields.findIndex((f) => f.key === this.field());
    if (fieldIdx === -1) return options;
    const seriesIdx = fieldIdx + 1; // +1 for the x/time placeholder at index 0

    const series = [...(options.series ?? [])];
    series[seriesIdx] = {
      ...series[seriesIdx],
      ...(this.label() != null ? { label: this.label() } : {}),
      ...(this.color() != null ? { stroke: this.color() } : {}),
      ...(this.width() != null ? { width: this.width() } : {}),
      ...(this.showPoints() != null ? { points: { show: this.showPoints() } } : {}),
      ...(this.connectNulls()[0]?.config() ?? {}),
    };

    return { ...options, series };
  }
}
