import { Component, input } from '@angular/core';
import uPlot from 'uplot';
import { UplotAxisModifier, UplotAxisParts } from './uplot-axis-modifier';

/** Soft bounds for a <uplot-axis>: the scale fits the data but won't shrink tighter than this, only extended past it if data exceeds it. */
@Component({
  selector: 'uplot-soft-bounds',
  template: '',
  providers: [{ provide: UplotAxisModifier, useExisting: UplotSoftBounds }],
})
export class UplotSoftBounds extends UplotAxisModifier {
  readonly min = input<number>();
  readonly max = input<number>();

  override modify(parts: UplotAxisParts): UplotAxisParts {
    const softMin = this.min();
    const softMax = this.max();
    const previousRange = parts.scale.range;

    return {
      ...parts,
      scale: {
        ...parts.scale,
        // widen the data range toward the soft bounds, then defer to whatever range logic was
        // already there (e.g. a hard min/max from <uplot-axis> short-circuits regardless)
        range: (u, dataMin, dataMax, scaleKey) => {
          const lo = Math.min(dataMin, softMin ?? dataMin);
          const hi = Math.max(dataMax, softMax ?? dataMax);
          return typeof previousRange === 'function'
            ? previousRange(u, lo, hi, scaleKey)
            : uPlot.rangeNum(lo, hi, 0.1, true);
        },
      },
    };
  }
}
