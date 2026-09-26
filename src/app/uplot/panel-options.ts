import uPlot from 'uplot';
import { tooltipPlugin } from './plugins/tooltip';

export type Unit = 'none' | 'percent' | 'bytes' | 'short';

export interface PanelOptions {
  unit?: Unit;
  /** hard clamp - the scale never shows less than min or more than max, regardless of data */
  min?: number;
  max?: number;
  /** soft bound - the scale fits the data, but won't shrink tighter than this; only extended past it if data exceeds it */
  softMin?: number;
  softMax?: number;
  /**
   * How null values are handled:
   * - false (default): gaps are left as breaks in the line
   * - true: all gaps are bridged with a line
   * - number: gaps up to this many seconds wide are bridged; wider gaps stay broken
   */
  connectNulls?: boolean | number;
}

function formatBytes(v: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let n = v;
  let i = 0;
  while (Math.abs(n) >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}

function formatShort(v: number): string {
  const units = ['', 'K', 'M', 'B'];
  let n = v;
  let i = 0;
  while (Math.abs(n) >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return `${n.toFixed(n % 1 === 0 ? 0 : 1)}${units[i]}`;
}

const unitFormatters: Record<Unit, (v: number) => string> = {
  none: (v) => v.toString(),
  percent: (v) => `${v.toFixed(1)}%`,
  bytes: formatBytes,
  short: formatShort,
};

/** keeps only null gaps wider than thresholdSeconds, so narrower gaps render as a connected line */
function gapsThreshold(thresholdSeconds: number): uPlot.Series.GapsRefiner {
  return (u, _seriesIdx, _idx0, _idx1, nullGaps) =>
    nullGaps.filter(([fromPx, toPx]) => {
      const fromVal = u.posToVal(fromPx, 'x', true);
      const toVal = u.posToVal(toPx, 'x', true);
      return toVal - fromVal > thresholdSeconds;
    });
}

function yRange(panel: PanelOptions): uPlot.Scale.Range {
  return (_u, dataMin, dataMax) => {
    if (panel.min != null && panel.max != null) return [panel.min, panel.max];

    const min = panel.min ?? Math.min(dataMin, panel.softMin ?? dataMin);
    const max = panel.max ?? Math.max(dataMax, panel.softMax ?? dataMax);

    return uPlot.rangeNum(min, max, 0.1, true);
  };
}

/**
 * Composes Grafana-style panel options (unit, min/max, softMin/softMax) onto a base
 * uPlot.Options describing the chart's own series/layout. Keeps the Uplot wrapper itself
 * generic - all panel semantics live here.
 */
export function toUplotOptions(panel: PanelOptions, base: uPlot.Options): uPlot.Options {
  const format = unitFormatters[panel.unit ?? 'none'];

  return {
    ...base,
    scales: {
      ...base.scales,
      y: { ...base.scales?.['y'], range: yRange(panel) },
    },
    axes: base.axes?.map((axis, i) =>
      i === 1 ? { ...axis, values: (_u, splits) => splits.map(format) } : axis,
    ),
    series: base.series?.map((s, i) => {
      if (i === 0) return s;

      const connectNulls = panel.connectNulls ?? false;

      if (typeof connectNulls === 'number') {
        return { ...s, spanGaps: false, gaps: gapsThreshold(connectNulls) };
      }

      return { ...s, spanGaps: connectNulls };
    }),
    plugins: [...(base.plugins ?? []), tooltipPlugin({ formatValue: (v) => format(v) })],
  };
}
