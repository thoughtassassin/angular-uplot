import uPlot from 'uplot';
import { dataMatch, optionsUpdateState } from './options-update-state';

describe('optionsUpdateState', () => {
  const base: uPlot.Options = { width: 800, height: 300, series: [] };

  it('returns keep when nothing changed', () => {
    expect(optionsUpdateState(base, { ...base })).toBe('keep');
  });

  it('returns update when only width/height changed', () => {
    expect(optionsUpdateState(base, { ...base, width: 900, height: 400 })).toBe('update');
  });

  it('returns create when any other key changed', () => {
    const series: uPlot.Series[] = [{ label: 'a' }];
    expect(optionsUpdateState(base, { ...base, series })).toBe('create');
  });

  it('returns create when a key is added or removed', () => {
    expect(optionsUpdateState(base, { ...base, legend: { show: true } })).toBe('create');
  });
});

describe('dataMatch', () => {
  it('returns true for equal values in different array references', () => {
    const lhs: uPlot.AlignedData = [[1, 2, 3], [4, 5, 6]];
    const rhs: uPlot.AlignedData = [[1, 2, 3], [4, 5, 6]];
    expect(dataMatch(lhs, rhs)).toBe(true);
  });

  it('returns false when a value differs', () => {
    const lhs: uPlot.AlignedData = [[1, 2, 3], [4, 5, 6]];
    const rhs: uPlot.AlignedData = [[1, 2, 3], [4, 5, 7]];
    expect(dataMatch(lhs, rhs)).toBe(false);
  });

  it('returns false when series count differs', () => {
    const lhs: uPlot.AlignedData = [[1, 2, 3], [4, 5, 6]];
    const rhs: uPlot.AlignedData = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
    expect(dataMatch(lhs, rhs)).toBe(false);
  });
});
