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
 * values array that has to be kept in sync with `fields` by index.`fields[0]` is conventionally
 * the time field, in epoch milliseconds, for time-indexed data.
 *
 * Any datasource (REST API, Prometheus, Pinot, ...) needs one adapter producing this shape.
 * This is the built-in default adapter's input shape (see `dataFrameAdapter`); consumers with a
 * different data shape can supply their own `DataAdapter` instead.
 */
export interface DataFrame {
  fields: DataField[];
}
