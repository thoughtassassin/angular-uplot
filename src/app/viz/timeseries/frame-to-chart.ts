import uPlot from 'uplot';
import { DataFrame } from '../../data/data-frame';
import { defaultPalette } from '../../shared/palette';
import { TimeSeriesPanelOptions } from './panel-options';

export interface ChartFromFrame {
  data: uPlot.AlignedData;
  series: uPlot.Series[];
  seriesOverrides: (Partial<TimeSeriesPanelOptions> | undefined)[];
}

/** Converts a DataFrame into what the uPlot wrapper needs: aligned data, per-series styling, and any per-series TimeSeriesPanelOptions overrides pulled from each field's config. */
export function frameToChart(frame: DataFrame, palette: string[] = defaultPalette): ChartFromFrame {
  const [timeField, ...valueFields] = frame.fields;

  const data = [
    timeField.values.map((t) => (t as number) / 1000),
    ...valueFields.map((field) => field.values),
  ] as uPlot.AlignedData;

  const series: uPlot.Series[] = [{}];
  const seriesOverrides: (Partial<TimeSeriesPanelOptions> | undefined)[] = [undefined];

  valueFields.forEach((field, i) => {
    series.push({
      label: field.config?.label ?? field.name,
      stroke: field.config?.color ?? palette[i % palette.length],
      width: 2,
      points: { show: false },
    });

    const connectNulls = field.config?.custom?.['connectNulls'] as boolean | number | undefined;
    seriesOverrides.push(connectNulls !== undefined ? { connectNulls } : undefined);
  });

  return { data, series, seriesOverrides };
}
