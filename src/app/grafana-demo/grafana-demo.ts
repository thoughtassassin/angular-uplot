import { Component, signal } from '@angular/core';
import { DataFrame } from 'angular-uplot';
import { TimeSeriesPanel } from '../viz/timeseries/time-series-panel';
import { makeFrame } from '../mock-frame';

/** The Grafana-style demo: TimeSeriesPanel (settings form, tooltip, etc.) built on top of the library. */
@Component({
  selector: 'app-grafana-demo',
  imports: [TimeSeriesPanel],
  templateUrl: './grafana-demo.html',
  styleUrl: './grafana-demo.sass',
})
export class GrafanaDemo {
  protected readonly frame = signal<DataFrame>(makeFrame());

  protected readonly showControls = signal(true);

  protected refreshData(): void {
    this.frame.set(makeFrame());
  }

  protected setShowControls(value: boolean): void {
    this.showControls.set(value);
  }
}
