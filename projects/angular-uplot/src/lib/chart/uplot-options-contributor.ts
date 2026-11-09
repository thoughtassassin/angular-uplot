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
}
