import uPlot from 'uplot';
import type { AdaptedFrame, DataAdapter, FieldMeta } from './data-adapter';
import type { DataFrame } from './data-frame';

/**
 * The built-in default DataAdapter<DataFrame>: converts ms epoch time to seconds and pulls
 * label/color/custom per field. Purely a shape translation - styling defaults (palette
 * fallback, line width, point visibility) are the chart facade's concern, not the adapter's.
 */
export const dataFrameAdapter: DataAdapter<DataFrame> = (frame) => {
  const [timeField, ...valueFields] = frame.fields;

  const data = [
    // `t == null` (not `=== null`) so a missing-field `undefined` is treated the same as an
    // explicit `null` - both mean "no timestamp for this point", not epoch 0.
    (timeField?.values ?? []).map((t) => (t == null ? null : t / 1000)),
    ...valueFields.map((field) => field.values),
  ] as uPlot.AlignedData;

  const fields: FieldMeta[] = valueFields.map((field) => ({
    key: field.name,
    label: field.config?.label,
    color: field.config?.color,
    custom: field.config?.custom,
  }));

  return { data, fields } as AdaptedFrame;
};
