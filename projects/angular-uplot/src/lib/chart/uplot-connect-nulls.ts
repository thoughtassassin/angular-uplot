import { Component, input } from '@angular/core';
import uPlot from 'uplot';
import { UplotSeriesModifier } from './uplot-series-modifier';

/**
 * Keeps only null gaps wider than thresholdMs, so narrower gaps render as a connected line.
 * uPlot's own x-scale here is in seconds (the adapter converts epoch ms to epoch seconds), so
 * the gap width is converted back to ms before comparing against the ms threshold.
 */
function gapsThreshold(thresholdMs: number): uPlot.Series.GapsRefiner {
  return (u, _seriesIdx, _idx0, _idx1, nullGaps) =>
    nullGaps.filter(([fromPx, toPx]) => {
      const fromVal = u.posToVal(fromPx, 'x', true);
      const toVal = u.posToVal(toPx, 'x', true);
      return (toVal - fromVal) * 1000 > thresholdMs;
    });
}

/**
 * Null-gap handling for a <uplot-series>: false (default) leaves gaps broken, true bridges all
 * of them, a number bridges only gaps narrower than that many milliseconds - matches Grafana's
 * spanNulls convention.
 */
@Component({
  selector: 'uplot-connect-nulls',
  template: '',
  providers: [{ provide: UplotSeriesModifier, useExisting: UplotConnectNulls }],
})
export class UplotConnectNulls extends UplotSeriesModifier {
  readonly thresholdMs = input<number | boolean>(true);

  override modify(series: Partial<uPlot.Series>): Partial<uPlot.Series> {
    const threshold = this.thresholdMs();
    if (typeof threshold === 'number') {
      return { ...series, spanGaps: false, gaps: gapsThreshold(threshold) };
    }
    return { ...series, spanGaps: threshold };
  }
}
