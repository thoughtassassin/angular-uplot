import uPlot from 'uplot';
import { AdaptedFrame } from '../data/data-adapter';

/**
 * Open extension point for <uplot-series>: any component that provides itself under this token
 * contributes to the series' uPlot.Series config, folded in content order (same `useExisting`
 * pattern as UplotOptionsContributor, one level down). `UplotConnectNulls` is the library's own
 * implementation, not a special case - write your own the same way to add a new series-level
 * behavior without forking UplotSeries.
 */
export abstract class UplotSeriesModifier {
  /** Returns a modified Partial<uPlot.Series> - don't mutate `series` in place. `adapted` is the current chart data, for a modifier that needs to make a decision from it. */
  abstract modify(series: Partial<uPlot.Series>, adapted: AdaptedFrame): Partial<uPlot.Series>;
}
