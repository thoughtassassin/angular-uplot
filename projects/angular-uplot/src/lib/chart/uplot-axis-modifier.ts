import uPlot from 'uplot';
import { AdaptedFrame } from '../data/data-adapter';

export interface UplotAxisParts {
  axis: Partial<uPlot.Axis>;
  scale: Partial<uPlot.Scale>;
}

/**
 * Open extension point for <uplot-axis>: any component that provides itself under this token
 * contributes to the axis' uPlot.Axis/uPlot.Scale config, folded in content order. `UplotSoftBounds`
 * is the library's own implementation, not a special case. A modifier that needs to affect the
 * scale's range should *wrap* `parts.scale.range` (compose a new function that calls the
 * previous one) rather than replace it outright, so it stacks with other range-affecting
 * modifiers instead of clobbering them.
 */
export abstract class UplotAxisModifier {
  /** Returns modified UplotAxisParts - don't mutate `parts` in place. `adapted` is the current chart data, for a modifier that needs to make a decision from it (e.g. a unit picker choosing a magnitude from the data's peak value). */
  abstract modify(parts: UplotAxisParts, adapted: AdaptedFrame): UplotAxisParts;
}
