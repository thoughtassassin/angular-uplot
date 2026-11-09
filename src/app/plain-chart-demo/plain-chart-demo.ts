import { Component, signal } from '@angular/core';
import { DataFrame, UplotAxis, UplotChart, UplotLegend, UplotSeries, UplotSoftBounds } from 'angular-uplot';
import { makeFrame } from '../mock-frame';

/**
 * Demonstrates <uplot-chart> used directly - no settings form, no Grafana opinions - to prove
 * the declarative composition layer works standalone, not just as plumbing under TimeSeriesPanel.
 */
@Component({
  selector: 'app-plain-chart-demo',
  imports: [UplotChart, UplotSeries, UplotAxis, UplotLegend, UplotSoftBounds],
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
