export type FieldType = 'time' | 'number';

export interface FieldConfig {
  label?: string;
  color?: string;
  /** per-field options specific to whichever visualization renders this frame (e.g. a time series field's connectNulls override) */
  custom?: Record<string, unknown>;
}

export interface DataField {
  name: string;
  type: FieldType;
  config?: FieldConfig;
  values: (number | null)[];
}

/**
 * A backend-agnostic data shape modeled on Grafana's DataFrame: one table of same-length
 * columns (fields), each field self-contained with its own values rather than a separate
 * values array that has to be kept in sync with `fields` by index. `fields[0]` is
 * conventionally the time field, in epoch milliseconds, for time-indexed data.
 *
 * Any datasource (REST API, Prometheus, Pinot, ...) needs one adapter producing this shape.
 * Each visualization under viz/ then interprets the frame however it needs - a time series
 * panel renders it directly (see viz/timeseries/frame-to-chart.ts); a future stat or pie chart
 * panel might instead reduce each field down to a single value.
 */
export interface DataFrame {
  fields: DataField[];
}
