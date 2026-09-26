import { Unit } from './units';

/**
 * The unit/min/max/soft-bound options common to any visualization with a numeric value axis.
 * Modeled on Grafana's "standard field options" - unit and min/max are treated as universal
 * across panel types there, unlike more render-specific options (tooltip behavior, connect
 * nulls, ...) which stay defined per visualization instead of living here.
 */
export interface ValueScaleOptions {
  unit?: Unit;
  /** hard clamp - the scale never shows less than min or more than max, regardless of data */
  min?: number;
  max?: number;
  /** soft bound - the scale fits the data, but won't shrink tighter than this; only extended past it if data exceeds it */
  softMin?: number;
  softMax?: number;
}
