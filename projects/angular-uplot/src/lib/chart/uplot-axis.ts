import { Component, contentChildren, input } from '@angular/core';
import uPlot from 'uplot';
import { Unit, unitFormatters } from '../shared/units';
import { UplotAxisModifier, UplotAxisParts } from './uplot-axis-modifier';
import { UplotOptionsContributor } from './uplot-options-contributor';

/**
 * uPlot's axis gutter defaults to a fixed 50px (not auto-measured from label text), so
 * formatted labels longer than that get clipped against the canvas edge. This measures the
 * widest rendered label each layout pass and sizes the gutter to fit it.
 */
function axisSize(): uPlot.Axis.Size {
  let lastSize = 50;

  return (u, values, axisIdx, cycleNum) => {
    // bail out after the first pass so the layout converges instead of oscillating
    if (cycleNum > 1) return lastSize;

    const axis = u.axes[axisIdx];
    const ticksSize = (axis.ticks?.size ?? 0) + (axis.gap ?? 0);

    const longest = (values ?? []).reduce((a, b) => (b != null && b.length > a.length ? b : a), '');

    let textWidth = 0;
    if (longest) {
      const font = axis.font as unknown as [string, number];
      u.ctx.font = font[0];
      textWidth = u.ctx.measureText(longest).width / uPlot.pxRatio;
    }

    lastSize = Math.ceil(ticksSize + textWidth + 8);
    return lastSize;
  };
}

/** Declares a value axis (and its backing scale) for a <uplot-chart>: unit formatting, hard min/max, and soft bounds via a nested <uplot-soft-bounds> (or any other UplotAxisModifier). */
@Component({
  selector: 'uplot-axis',
  imports: [],
  template: '',
  providers: [{ provide: UplotOptionsContributor, useExisting: UplotAxis }],
})
export class UplotAxis extends UplotOptionsContributor {
  readonly scale = input.required<'x' | 'y'>();
  readonly unit = input<Unit>('none');
  readonly min = input<number>();
  readonly max = input<number>();

  private readonly modifiers = contentChildren(UplotAxisModifier);

  override contribute(options: uPlot.Options): uPlot.Options {
    const format = unitFormatters[this.unit()];
    const min = this.min();
    const max = this.max();

    let parts: UplotAxisParts = {
      axis: {
        scale: this.scale(),
        values: (_u, splits) => splits.map(format),
        size: axisSize(),
      },
      scale: {
        range: (_u, dataMin, dataMax) => {
          if (min != null && max != null) return [min, max];
          return uPlot.rangeNum(min ?? dataMin, max ?? dataMax, 0.1, true);
        },
      },
    };

    parts = this.modifiers().reduce((p, modifier) => modifier.modify(p), parts);

    return {
      ...options,
      // additive, not keyed to a field - a new axis entry per <uplot-axis>, same as a new scale
      axes: [...(options.axes ?? []), parts.axis],
      scales: { ...options.scales, [this.scale()]: parts.scale },
    };
  }
}
