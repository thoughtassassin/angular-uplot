import { Component, input } from '@angular/core';
import uPlot from 'uplot';
import { UplotOptionsContributor } from './uplot-options-contributor';

/** Registers a uPlot plugin (hooks-based, no framework dependency) on a <uplot-chart>. */
@Component({
  selector: 'uplot-plugin',
  imports: [],
  template: '',
  providers: [{ provide: UplotOptionsContributor, useExisting: UplotPlugin }],
})
export class UplotPlugin extends UplotOptionsContributor {
  readonly plugin = input.required<uPlot.Plugin>();

  override contribute(options: uPlot.Options): uPlot.Options {
    return { ...options, plugins: [...(options.plugins ?? []), this.plugin()] };
  }
}
