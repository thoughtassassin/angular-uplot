import { ValueScaleOptions } from '../../shared/value-scale-options';

/**
 * Grafana-style time series panel settings, edited by TimeSeriesPanel's settings form and
 * applied declaratively via <uplot-chart>'s content-projected children (see time-series-panel.html)
 * - unit/min/max/softMin/softMax drive <uplot-axis>, connectNulls drives <uplot-connect-nulls>,
 * tooltipMode/tooltipPinOnClick drive the tooltip <uplot-plugin>, showLegend drives <uplot-legend>.
 */
export interface TimeSeriesPanelOptions extends ValueScaleOptions {
  /**
   * How null values are handled:
   * - false (default): gaps are left as breaks in the line
   * - true: all gaps are bridged with a line
   * - number: gaps up to this many milliseconds wide are bridged; wider gaps stay broken
   */
  connectNulls?: boolean | number;
  /** 'all' (default): every series in the tooltip. 'single': only the hovered series. 'none': no tooltip. */
  tooltipMode?: 'none' | 'single' | 'all';
  /** when true, clicking the chart freezes the tooltip in place until clicked again */
  tooltipPinOnClick?: boolean;
  /** shows uPlot's built-in legend below the chart */
  showLegend?: boolean;
}
