import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import uPlot from 'uplot';
import {
  DataField,
  DataFrame,
  UPLOT_UNITS,
  UplotAxis,
  UplotChart,
  UplotConnectNulls,
  UplotLegend,
  UplotPlugin,
  UplotSeries,
  UplotSoftBounds,
  type Unit,
} from 'angular-uplot';
import { TimeSeriesPanelOptions } from './panel-options';
import { tooltipPlugin } from './plugins/tooltip';

const defaultPanelOptions: TimeSeriesPanelOptions = {
  unit: 'percent',
  softMin: 0,
  softMax: 100,
  connectNulls: false,
  tooltipMode: 'all',
  tooltipPinOnClick: false,
  showLegend: false,
};

function parseNumberInput(value: string): number | undefined {
  return value === '' ? undefined : Number(value);
}

/**
 * A reusable Grafana-style time series panel: feed it a DataFrame and it renders the chart
 * plus a settings form (unit, min/max, connect-nulls, tooltip, legend) driving <uplot-chart>
 * underneath. Doesn't know or care where `frame` comes from.
 *
 * Built entirely on the library's declarative composition layer - no hand-built uPlot.Options.
 * `panel-options.ts` is now just the settings interface; `toUplotOptions()`/`yRange()`/
 * `axisSize()`/`gapsThreshold()` and `frame-to-chart.ts` are gone, since <uplot-axis>,
 * <uplot-soft-bounds>, and <uplot-connect-nulls> already implement the same logic.
 *
 * `options` seeds the panel's configuration and can be supplied by a parent (e.g. a saved
 * dashboard panel config). When `showControls` is true (default) the settings form lets a
 * user edit that configuration locally; set it false for a read-only viewer driven entirely
 * by whatever `options` the parent passes in.
 */
@Component({
  selector: 'app-timeseries-panel',
  imports: [UplotChart, UplotSeries, UplotAxis, UplotLegend, UplotPlugin, UplotConnectNulls, UplotSoftBounds],
  templateUrl: './time-series-panel.html',
  styleUrl: './time-series-panel.sass',
})
export class TimeSeriesPanel {
  private readonly unitFormatters = inject(UPLOT_UNITS);

  readonly frame = input.required<DataFrame>();
  readonly options = input<TimeSeriesPanelOptions>(defaultPanelOptions);
  readonly showControls = input(true);
  readonly refresh = output<void>();

  // re-seeds from `options` whenever it changes, but stays locally writable via the
  // settings form in between - lets the panel be either controlled or user-editable
  protected readonly panelOptions = linkedSignal(() => this.options());

  protected readonly valueFields = computed<DataField[]>(() => this.frame().fields.slice(1));

  protected readonly tooltip = computed<uPlot.Plugin | null>(() => {
    const panel = this.panelOptions();
    if (panel.tooltipMode === 'none') return null;

    const format = this.unitFormatters[panel.unit ?? 'none'] ?? this.unitFormatters['none'];
    return tooltipPlugin({
      formatValue: (v) => format(v),
      mode: panel.tooltipMode === 'single' ? 'single' : 'all',
      pinOnClick: panel.tooltipPinOnClick ?? false,
    });
  });

  protected readonly connectNullsMode = computed<'never' | 'always' | 'threshold'>(() => {
    const cn = this.panelOptions().connectNulls;
    if (cn === true) return 'always';
    if (typeof cn === 'number') return 'threshold';
    return 'never';
  });

  protected readonly connectNullsThreshold = computed(() => {
    const cn = this.panelOptions().connectNulls;
    return typeof cn === 'number' ? cn : 300_000; // 5 minutes
  });

  /** a field's own connectNulls override (from field.config.custom) wins over the panel-wide default */
  protected resolveConnectNulls(field: DataField): boolean | number {
    const override = field.config?.custom?.['connectNulls'] as boolean | number | undefined;
    return override ?? this.panelOptions().connectNulls ?? false;
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

  protected setTooltipMode(mode: string): void {
    this.panelOptions.update((p) => ({ ...p, tooltipMode: mode as TimeSeriesPanelOptions['tooltipMode'] }));
  }

  protected setTooltipPinOnClick(value: boolean): void {
    this.panelOptions.update((p) => ({ ...p, tooltipPinOnClick: value }));
  }

  protected setShowLegend(value: boolean): void {
    this.panelOptions.update((p) => ({ ...p, showLegend: value }));
  }
}
