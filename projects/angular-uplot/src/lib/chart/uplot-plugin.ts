import { Component, input } from '@angular/core';
import uPlot from 'uplot';

/** Registers a uPlot plugin (hooks-based, no framework dependency) on a <uplot-chart>. */
@Component({ selector: 'uplot-plugin', imports: [], template: '' })
export class UplotPlugin {
  readonly plugin = input.required<uPlot.Plugin>();
}
