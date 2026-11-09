import { Component, computed, contentChildren, input } from '@angular/core';
import uPlot from 'uplot';
import { UplotConnectNulls } from './uplot-connect-nulls';

/**
 * Declares styling/behavior for one field of a <uplot-chart>'s data, matched by `field` key
 * against the adapter's field metadata - not by template position. Optional: a field with no
 * matching <uplot-series> just uses the adapter's own label/color (or a palette fallback).
 */
@Component({ selector: 'uplot-series', imports: [], template: '' })
export class UplotSeries {
  readonly field = input.required<string>();
  readonly label = input<string>();
  readonly color = input<string>();
  /** Line stroke width in px. Leave unset to use uPlot's own default. */
  readonly width = input<number>();
  /** Whether to render a point marker at each data value. Leave unset to use uPlot's own default. */
  readonly showPoints = input<boolean>();

  private readonly connectNulls = contentChildren(UplotConnectNulls);

  /** Extra per-series uPlot config contributed by modifier children (e.g. connectNulls) - label/stroke resolution is the chart facade's job, since it also needs the adapter's fallback values. */
  readonly modifierConfig = computed<Partial<uPlot.Series>>(() => ({
    ...(this.width() != null ? { width: this.width() } : {}),
    ...(this.showPoints() != null ? { points: { show: this.showPoints() } } : {}),
    ...(this.connectNulls()[0]?.config() ?? {}),
  }));
}
