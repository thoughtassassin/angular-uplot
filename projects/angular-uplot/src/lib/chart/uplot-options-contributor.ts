import uPlot from 'uplot';
import { AdaptedFrame } from '../data/data-adapter';

/**
 * Open extension point for <uplot-chart>: any component that provides itself under this token
 * gets folded into the chart's uPlot.Options, in content/template order. The library's own
 * <uplot-series>/<uplot-axis>/<uplot-legend>/<uplot-plugin> are just the first four
 * implementations, not special cases - a third party (or your own app) can author a new one
 * (a bar-chart series, a min/max band, cursor sync, ...) with no change to <uplot-chart> itself:
 *
 * ```ts
 * @Component({
 *   selector: 'my-band',
 *   providers: [{ provide: UplotOptionsContributor, useExisting: MyBand }],
 *   template: '',
 * })
 * export class MyBand extends UplotOptionsContributor {
 *   override contribute(options: uPlot.Options, adapted: AdaptedFrame): uPlot.Options {
 *     return { ...options, bands: [...(options.bands ?? []), myBandConfig] };
 *   }
 * }
 * ```
 */
export abstract class UplotOptionsContributor {
  /** Returns a modified uPlot.Options - don't mutate `options` in place, since contributors run in sequence over the same object. */
  abstract contribute(options: uPlot.Options, adapted: AdaptedFrame): uPlot.Options;

  /**
   * Optional: a data-derived fact that, if its value changes between calls, forces
   * <uplot-chart> to rebuild its options even though the adapter's field metadata
   * (key/label/color/custom) didn't change - e.g. a unit picker returning the magnitude it
   * chose from the data's peak value, so the axis only rebuilds when that magnitude actually
   * changes, not on every data refresh. Compared with `Object.is`, so return a primitive.
   * Leave unimplemented (the default) to never force a rebuild from data.
   */
  dependsOn?(adapted: AdaptedFrame): unknown;
}
