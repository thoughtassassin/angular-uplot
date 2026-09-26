import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import uPlot from 'uplot';
import { Uplot } from './uplot/uplot';
import { PanelOptions, Unit, toUplotOptions } from './uplot/panel-options';

function makeData(): uPlot.AlignedData {
  const xs: number[] = [];
  const cpu: (number | null)[] = [];
  const mem: (number | null)[] = [];
  const now = Math.floor(Date.now() / 1000);
  for (let i = 0; i < 200; i++) {
    xs.push(now - (200 - i) * 60);
    // punch a few gaps in each series so "connect null values" has something to show
    const cpuGap = i >= 60 && i < 75;
    const memGap = i >= 120 && i < 130;
    cpu.push(cpuGap ? null : Math.sin(i / 10) * 20 + 40 + Math.random() * 8);
    mem.push(memGap ? null : Math.cos(i / 14) * 15 + 60 + Math.random() * 6);
  }
  return [xs, cpu, mem];
}

const baseChartOptions: uPlot.Options = {
  width: 800,
  height: 300,
  legend: { show: false },
  axes: [{}, {}],
  series: [
    {},
    {
      label: 'CPU',
      stroke: '#73bf69',
      width: 2,
      points: { show: false },
    },
    {
      label: 'Memory',
      stroke: '#5794f2',
      width: 2,
      points: { show: false },
    },
  ],
};

function parseNumberInput(value: string): number | undefined {
  return value === '' ? undefined : Number(value);
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Uplot],
  templateUrl: './app.html',
  styleUrl: './app.sass',
})
export class App {
  protected readonly title = signal('angular-uplot');

  protected readonly panelOptions = signal<PanelOptions>({
    unit: 'percent',
    softMin: 0,
    softMax: 100,
    connectNulls: false,
  });

  protected readonly uplotOptions = computed(() => toUplotOptions(this.panelOptions(), baseChartOptions));

  protected readonly connectNullsMode = computed<'never' | 'always' | 'threshold'>(() => {
    const cn = this.panelOptions().connectNulls;
    if (cn === true) return 'always';
    if (typeof cn === 'number') return 'threshold';
    return 'never';
  });

  protected readonly connectNullsThreshold = computed(() => {
    const cn = this.panelOptions().connectNulls;
    return typeof cn === 'number' ? cn : 300;
  });

  protected readonly chartData = signal<uPlot.AlignedData>(makeData());

  protected refreshData(): void {
    this.chartData.set(makeData());
  }

  protected setUnit(value: string): void {
    this.panelOptions.update((p) => ({ ...p, unit: value as Unit }));
  }

  protected setMin(value: string): void {
    this.panelOptions.update((p) => ({ ...p, min: parseNumberInput(value) }));
  }

  protected setMax(value: string): void {
    this.panelOptions.update((p) => ({ ...p, max: parseNumberInput(value) }));
  }

  protected setSoftMin(value: string): void {
    this.panelOptions.update((p) => ({ ...p, softMin: parseNumberInput(value) }));
  }

  protected setSoftMax(value: string): void {
    this.panelOptions.update((p) => ({ ...p, softMax: parseNumberInput(value) }));
  }

  protected setConnectNullsMode(mode: string): void {
    this.panelOptions.update((p) => {
      if (mode === 'always') return { ...p, connectNulls: true };
      if (mode === 'threshold') return { ...p, connectNulls: this.connectNullsThreshold() };
      return { ...p, connectNulls: false };
    });
  }

  protected setConnectNullsThreshold(value: string): void {
    this.panelOptions.update((p) => ({ ...p, connectNulls: parseNumberInput(value) ?? 0 }));
  }
}
