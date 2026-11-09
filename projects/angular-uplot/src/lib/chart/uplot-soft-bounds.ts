import { Component, computed, input } from '@angular/core';

/** Soft bounds for a <uplot-axis>: the scale fits the data but won't shrink tighter than this, only extended past it if data exceeds it. */
@Component({ selector: 'uplot-soft-bounds', template: '' })
export class UplotSoftBounds {
  readonly min = input<number>();
  readonly max = input<number>();

  readonly config = computed(() => ({ softMin: this.min(), softMax: this.max() }));
}
