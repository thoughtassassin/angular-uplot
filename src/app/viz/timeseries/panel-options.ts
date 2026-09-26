import uPlot from 'uplot';
import { tooltipPlugin } from './plugins/tooltip';
import { unitFormatters } from '../../shared/units';
import { ValueScaleOptions } from '../../shared/value-scale-options';

export interface TimeSeriesPanelOptions extends ValueScaleOptions {
  /**
   * How null values are handled:
   * - false (default): gaps are left as breaks in the line
   * - true: all gaps are bridged with a line
   * - number: gaps up to this many seconds wide are bridged; wider gaps stay broken
   */
  connectNulls?: boolean | number;
  /** 'all' (default): every series in the tooltip. 'single': only the hovered series. 'none': no tooltip. */
  tooltipMode?: 'none' | 'single' | 'all';
  /** shows uPlot's built-in legend below the chart */
  showLegend?: boolean;
}

/** keeps only null gaps wider than thresholdSeconds, so narrower gaps render as a connected line */
function gapsThreshold(thresholdSeconds: number): uPlot.Series.GapsRefiner {
  return (u, _seriesIdx, _idx0, _idx1, nullGaps) =>
    nullGaps.filter(([fromPx, toPx]) => {
      const fromVal = u.posToVal(fromPx, 'x', true);
      const toVal = u.posToVal(toPx, 'x', true);
      return toVal - fromVal > thresholdSeconds;
    });
}

/**
 * uPlot's y-axis gutter defaults to a fixed 50px (not auto-measured from label text), so
 * formatted labels longer than that get clipped against the canvas edge. This measures the
 * widest rendered label each layout pass and sizes the gutter to fit it.
 */
function axisSize(): uPlot.Axis.Size {
  let lastSize = 50;

  return (u, values, axisIdx, cycleNum) => {
    // bail out after the first pass so the layout converges instead of oscillating
    if (cycleNum > 1) return lastSize;

    const axis = u.axes[axisIdx];
    const ticksSize = (axis.ticks?.size ?? 0) + (axis.gap ?? 0);

    const longest = (values ?? []).reduce((a, b) => (b != null && b.length > a.length ? b : a), '');

    let textWidth = 0;
    if (longest) {
      const font = axis.font as unknown as [string, number];
      u.ctx.font = font[0];
      textWidth = u.ctx.measureText(longest).width / uPlot.pxRatio;
    }

    lastSize = Math.ceil(ticksSize + textWidth + 8);
    return lastSize;
  };
}

function yRange(panel: TimeSeriesPanelOptions): uPlot.Scale.Range {
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
 *
 * `seriesOverrides` mirrors Grafana's fieldConfig.defaults/overrides split: `panel` is
 * applied to every series, and `seriesOverrides[i]` (index-aligned with base.series,
 * index 0 is the time series and is ignored) can override individual fields per-series.
 */
export function toUplotOptions(
  panel: TimeSeriesPanelOptions,
  base: uPlot.Options,
  seriesOverrides: (Partial<TimeSeriesPanelOptions> | undefined)[] = [],
): uPlot.Options {
  const format = unitFormatters[panel.unit ?? 'none'];

  return {
    ...base,
    legend: {
      ...base.legend,
      show: panel.showLegend ?? false,
      live: false,
      markers: {
        ...base.legend?.markers,
        width: 0,
        fill: (u, seriesIdx) => {
          const s = u.series[seriesIdx];
          const stroke = typeof s.stroke === 'function' ? s.stroke(u, seriesIdx) : s.stroke;
          return (stroke as string) ?? '';
        },
      },
    },
    scales: {
      ...base.scales,
      y: { ...base.scales?.['y'], range: yRange(panel) },
    },
    axes: base.axes?.map((axis, i) =>
      i === 1 ? { ...axis, values: (_u, splits) => splits.map(format), size: axisSize() } : axis,
    ),
    series: base.series?.map((s, i) => {
      if (i === 0) return s;

      const connectNulls = seriesOverrides[i]?.connectNulls ?? panel.connectNulls ?? false;

      if (typeof connectNulls === 'number') {
        return { ...s, spanGaps: false, gaps: gapsThreshold(connectNulls) };
      }

      return { ...s, spanGaps: connectNulls };
    }),
    plugins: [
      ...(base.plugins ?? []),
      ...(panel.tooltipMode === 'none'
        ? []
        : [tooltipPlugin({ formatValue: (v) => format(v), mode: panel.tooltipMode === 'single' ? 'single' : 'all' })]),
    ],
  };
}
