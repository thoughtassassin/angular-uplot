import { Component, signal } from '@angular/core';
import { DataFrame, UplotAxis, UplotChart, UplotLegend, UplotSeries, UplotSoftBounds } from 'angular-uplot';
import { makeFrame } from '../mock-frame';
import { UplotBarSeries } from './uplot-bar-series';

/**
 * Demonstrates <uplot-chart> used directly - no settings form, no Grafana opinions - to prove
 * the declarative composition layer works standalone, not just as plumbing under TimeSeriesPanel.
 * Also uses <uplot-bar-series> (app-level, not in the library) to prove UplotOptionsContributor
 * is a real extension point for new visualization types, not just the library's own internals.
 */
@Component({
  selector: 'app-plain-chart-demo',
  imports: [UplotChart, UplotSeries, UplotAxis, UplotLegend, UplotSoftBounds, UplotBarSeries],
  templateUrl: './plain-chart-demo.html',
})
export class PlainChartDemo {
  protected readonly frame = signal<DataFrame>(makeFrame());
  protected readonly height = signal(300);

  protected refreshData(): void {
    this.frame.set(makeFrame());
  }

  protected toggleHeight(): void {
    this.height.set(this.height() === 300 ? 450 : 300);
  }
}
