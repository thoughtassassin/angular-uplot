import { Component, computed, contentChildren, input } from '@angular/core';
import uPlot from 'uplot';
import { Unit, unitFormatters } from '../shared/units';
import { UplotSoftBounds } from './uplot-soft-bounds';

function yRange(min?: number, max?: number, softMin?: number, softMax?: number): uPlot.Scale.Range {
  return (_u, dataMin, dataMax) => {
    if (min != null && max != null) return [min, max];
    const lo = min ?? Math.min(dataMin, softMin ?? dataMin);
    const hi = max ?? Math.max(dataMax, softMax ?? dataMax);
    return uPlot.rangeNum(lo, hi, 0.1, true);
  };
}

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

/** Declares a value axis (and its backing scale) for a <uplot-chart>: unit formatting, hard min/max, and soft bounds via a nested <uplot-soft-bounds>. */
@Component({ selector: 'uplot-axis', imports: [], template: '' })
export class UplotAxis {
  readonly scale = input.required<'x' | 'y'>();
  readonly unit = input<Unit>('none');
  readonly min = input<number>();
  readonly max = input<number>();

  private readonly softBounds = contentChildren(UplotSoftBounds);

  readonly axisConfig = computed<Partial<uPlot.Axis>>(() => {
    const format = unitFormatters[this.unit()];
    return {
      scale: this.scale(),
      values: (_u, splits) => splits.map(format),
      size: axisSize(),
    };
  });

  readonly scaleConfig = computed<Partial<uPlot.Scale>>(() => {
    const soft = this.softBounds()[0];
    return { range: yRange(this.min(), this.max(), soft?.min(), soft?.max()) };
  });
}
