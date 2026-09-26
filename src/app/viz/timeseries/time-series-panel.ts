import { Component, computed, input, linkedSignal, output } from '@angular/core';
import uPlot from 'uplot';
import { Uplot } from '../../shared/uplot/uplot';
import { Unit } from '../../shared/units';
import { DataFrame } from '../../data/data-frame';
import { TimeSeriesPanelOptions, toUplotOptions } from './panel-options';
import { frameToChart } from './frame-to-chart';

const layoutOptions: uPlot.Options = {
  width: 800,
  height: 300,
  axes: [{}, {}],
  series: [],
};

const defaultPanelOptions: TimeSeriesPanelOptions = {
  unit: 'percent',
  softMin: 0,
  softMax: 100,
  connectNulls: false,
  tooltipMode: 'all',
  showLegend: false,
};

function parseNumberInput(value: string): number | undefined {
  return value === '' ? undefined : Number(value);
}

/**
 * A reusable Grafana-style time series panel: feed it a DataFrame and it renders the chart
 * plus a settings form (unit, min/max, connect-nulls, tooltip, legend) driving the uPlot
 * wrapper underneath. Doesn't know or care where `frame` comes from.
 *
 * `options` seeds the panel's configuration and can be supplied by a parent (e.g. a saved
 * dashboard panel config). When `showControls` is true (default) the settings form lets a
 * user edit that configuration locally; set it false for a read-only viewer driven entirely
 * by whatever `options` the parent passes in.
 */
@Component({
  selector: 'app-timeseries-panel',
  imports: [Uplot],
  templateUrl: './time-series-panel.html',
  styleUrl: './time-series-panel.sass',
})
export class TimeSeriesPanel {
  readonly frame = input.required<DataFrame>();
  readonly options = input<TimeSeriesPanelOptions>(defaultPanelOptions);
  readonly showControls = input(true);
  readonly refresh = output<void>();

  protected readonly chart = computed(() => frameToChart(this.frame()));

  protected readonly chartData = computed(() => this.chart().data);

  // re-seeds from `options` whenever it changes, but stays locally writable via the
  // settings form in between - lets the panel be either controlled or user-editable
  protected readonly panelOptions = linkedSignal(() => this.options());

  protected readonly uplotOptions = computed(() =>
    toUplotOptions(
      this.panelOptions(),
      { ...layoutOptions, series: this.chart().series },
      this.chart().seriesOverrides,
    ),
  );

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

  protected setTooltipMode(mode: string): void {
    this.panelOptions.update((p) => ({ ...p, tooltipMode: mode as TimeSeriesPanelOptions['tooltipMode'] }));
  }

  protected setShowLegend(value: boolean): void {
    this.panelOptions.update((p) => ({ ...p, showLegend: value }));
  }
}
