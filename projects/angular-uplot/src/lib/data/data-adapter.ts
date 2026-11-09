import uPlot from 'uplot';

/** Per-field metadata an adapter extracts from its source shape, keyed for matching against a declared <uplot-series>. */
export interface FieldMeta {
  key: string;
  label?: string;
  color?: string;
  custom?: Record<string, unknown>;
}

/** What any data source needs to boil down to for <uplot-chart>: aligned data plus one FieldMeta per value series (index-aligned with data[1..]). */
export interface AdaptedFrame {
  data: uPlot.AlignedData;
  fields: FieldMeta[];
}

/** Converts an arbitrary source shape `T` into an AdaptedFrame. `dataFrameAdapter` is the built-in default for `DataFrame`; supply your own for any other shape. */
export type DataAdapter<T> = (source: T) => AdaptedFrame;
