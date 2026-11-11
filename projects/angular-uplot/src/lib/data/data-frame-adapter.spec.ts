import { dataFrameAdapter } from './data-frame-adapter';
import { DataFrame } from './data-frame';

describe('dataFrameAdapter', () => {
  const frame: DataFrame = {
    fields: [
      { name: 'time', type: 'time', values: [1000, 2000, 3000] },
      {
        name: 'cpu',
        type: 'number',
        config: { label: 'CPU', color: '#ff0000', custom: { connectNulls: 30 } },
        values: [1, 2, null],
      },
      { name: 'memory', type: 'number', values: [10, 20, 30] },
    ],
  };

  it('converts time values from ms to seconds', () => {
    expect(dataFrameAdapter(frame).data[0]).toEqual([1, 2, 3]);
  });

  it('passes value fields through unchanged, index-aligned with fields metadata', () => {
    const { data } = dataFrameAdapter(frame);
    expect(data[1]).toEqual([1, 2, null]);
    expect(data[2]).toEqual([10, 20, 30]);
  });

  it('extracts key/label/color/custom per value field', () => {
    const { fields } = dataFrameAdapter(frame);
    expect(fields).toEqual([
      { key: 'cpu', label: 'CPU', color: '#ff0000', custom: { connectNulls: 30 } },
      { key: 'memory', label: undefined, color: undefined, custom: undefined },
    ]);
  });

  it('returns empty data and fields for an empty frame, instead of throwing', () => {
    expect(dataFrameAdapter({ fields: [] })).toEqual({ data: [[]], fields: [] });
  });

  it('keeps null time values as null, instead of coercing to epoch 0', () => {
    const frameWithNullTime: DataFrame = {
      fields: [
        { name: 'time', type: 'time', values: [1000, null, 3000] },
        { name: 'cpu', type: 'number', values: [1, 2, 3] },
      ],
    };
    expect(dataFrameAdapter(frameWithNullTime).data[0]).toEqual([1, null, 3]);
  });

  it('handles a frame with only a time field (no value fields)', () => {
    const timeOnlyFrame: DataFrame = {
      fields: [{ name: 'time', type: 'time', values: [1000, 2000] }],
    };
    expect(dataFrameAdapter(timeOnlyFrame)).toEqual({ data: [[1, 2]], fields: [] });
  });
});
