import uPlot from 'uplot';
import { PanelOptions } from './panel-options';

export interface FrameFieldConfig {
  label?: string;
  color?: string;
  /** per-series override of PanelOptions.connectNulls; falls back to the panel default when unset */
  connectNulls?: boolean | number;
}

export interface FrameField {
  name: string;
  type: 'time' | 'number';
  config?: FrameFieldConfig;
}

/**
 * A backend-agnostic time series shape modeled on Grafana's DataFrame: column-major values
 * aligned with `fields`, fields[0] is always the time column in epoch milliseconds. Any
 * datasource (REST API, Prometheus, Pinot, ...) just needs one adapter that produces this
 * shape - everything downstream (chart building, panel options, tooltip) stays the same.
 */
export interface TimeSeriesFrame {
  fields: FrameField[];
  values: (number | null)[][];
}

const defaultPalette = ['#73bf69', '#5794f2', '#ff780a', '#b877d9', '#fade2a'];

export interface ChartFromFrame {
  data: uPlot.AlignedData;
  series: uPlot.Series[];
  seriesOverrides: (Partial<PanelOptions> | undefined)[];
}

export function frameToChart(frame: TimeSeriesFrame, palette: string[] = defaultPalette): ChartFromFrame {
  const [time, ...valueColumns] = frame.values;

  const data = [time.map((t) => (t as number) / 1000), ...valueColumns] as uPlot.AlignedData;

  const series: uPlot.Series[] = [{}];
  const seriesOverrides: (Partial<PanelOptions> | undefined)[] = [undefined];

  frame.fields.slice(1).forEach((field, i) => {
    series.push({
      label: field.config?.label ?? field.name,
      stroke: field.config?.color ?? palette[i % palette.length],
      width: 2,
      points: { show: false },
    });

    seriesOverrides.push(
      field.config?.connectNulls !== undefined ? { connectNulls: field.config.connectNulls } : undefined,
    );
  });

  return { data, series, seriesOverrides };
}
