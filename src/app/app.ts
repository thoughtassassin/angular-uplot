import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Panel } from './panel/panel';
import { TimeSeriesFrame } from './uplot/time-series-frame';

// stands in for whatever your backend/datasource adapter returns - see time-series-frame.ts
function makeFrame(): TimeSeriesFrame {
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
      { name: 'Time', type: 'time' },
      // this field always bridges its own gaps regardless of the panel's connect-nulls setting
      { name: 'cpu', type: 'number', config: { label: 'CPU', color: '#73bf69', connectNulls: true } },
      { name: 'mem', type: 'number', config: { label: 'Memory', color: '#5794f2' } },
    ],
    values: [time, cpu, mem],
  };
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Panel],
  templateUrl: './app.html',
  styleUrl: './app.sass',
})
export class App {
  protected readonly title = signal('angular-uplot');

  protected readonly frame = signal<TimeSeriesFrame>(makeFrame());

  protected readonly showControls = signal(true);

  protected refreshData(): void {
    this.frame.set(makeFrame());
  }

  protected setShowControls(value: boolean): void {
    this.showControls.set(value);
  }
}
