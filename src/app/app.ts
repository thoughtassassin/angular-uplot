import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TimeSeriesPanel } from './viz/timeseries/time-series-panel';
import { DataFrame } from './data/data-frame';

// stands in for whatever your backend/datasource adapter returns - see data/data-frame.ts
function makeFrame(): DataFrame {
  const now = Date.now();
  const time: number[] = [];
  const cpu: (number | null)[] = [];
  const mem: (number | null)[] = [];

  for (let i = 0; i < 200; i++) {
    time.push(now - (200 - i) * 60_000);

    // punch a few gaps in each series so "connect null values" has something to show
    const cpuGap = i >= 60 && i < 75;
    const memGap = i >= 120 && i < 130;
    cpu.push(cpuGap ? null : Math.sin(i / 10) * 20 + 40 + Math.random() * 8);
    mem.push(memGap ? null : Math.cos(i / 14) * 15 + 60 + Math.random() * 6);
  }

  return {
    fields: [
      { name: 'Time', type: 'time', values: time },
      // this field always bridges its own gaps regardless of the panel's connect-nulls setting
      {
        name: 'cpu',
        type: 'number',
        config: { label: 'CPU', color: '#73bf69', custom: { connectNulls: true } },
        values: cpu,
      },
      { name: 'mem', type: 'number', config: { label: 'Memory', color: '#5794f2' }, values: mem },
    ],
  };
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TimeSeriesPanel],
  templateUrl: './app.html',
  styleUrl: './app.sass',
})
export class App {
  protected readonly title = signal('angular-uplot');

  protected readonly frame = signal<DataFrame>(makeFrame());

  protected readonly showControls = signal(true);

  protected refreshData(): void {
    this.frame.set(makeFrame());
  }

  protected setShowControls(value: boolean): void {
    this.showControls.set(value);
  }
}
