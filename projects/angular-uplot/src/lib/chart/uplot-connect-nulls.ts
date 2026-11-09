import { Component, input } from '@angular/core';
import uPlot from 'uplot';
import { UplotSeriesModifier } from './uplot-series-modifier';

/** Keeps only null gaps wider than thresholdSeconds, so narrower gaps render as a connected line. */
function gapsThreshold(thresholdSeconds: number): uPlot.Series.GapsRefiner {
  return (u, _seriesIdx, _idx0, _idx1, nullGaps) =>
    nullGaps.filter(([fromPx, toPx]) => {
      const fromVal = u.posToVal(fromPx, 'x', true);
      const toVal = u.posToVal(toPx, 'x', true);
      return toVal - fromVal > thresholdSeconds;
    });
}

/**
 * Null-gap handling for a <uplot-series>: false (default) leaves gaps broken, true bridges all
 * of them, a number bridges only gaps narrower than that many seconds.
 */
@Component({
  selector: 'uplot-connect-nulls',
  template: '',
  providers: [{ provide: UplotSeriesModifier, useExisting: UplotConnectNulls }],
})
export class UplotConnectNulls extends UplotSeriesModifier {
  readonly thresholdSeconds = input<number | boolean>(true);

  override modify(series: Partial<uPlot.Series>): Partial<uPlot.Series> {
    const threshold = this.thresholdSeconds();
    if (typeof threshold === 'number') {
      return { ...series, spanGaps: false, gaps: gapsThreshold(threshold) };
    }
    return { ...series, spanGaps: threshold };
  }
}
