import uPlot from 'uplot';

export type OptionsUpdateState = 'keep' | 'update' | 'create';

/**
 * Compares two uPlot.Options objects, ignoring width/height: if only those differ, a cheap
 * setSize() is enough ('update'); if anything else differs (shallow reference inequality - the
 * same limitation uPlot's own official React/Vue/Svelte wrappers share), the whole chart needs
 * to be destroyed and recreated ('create'); otherwise nothing changed ('keep').
 */
export function optionsUpdateState(previous: uPlot.Options, next: uPlot.Options): OptionsUpdateState {
  const { width: previousWidth, height: previousHeight, ...previousRest } = previous;
  const { width: nextWidth, height: nextHeight, ...nextRest } = next;

  let state: OptionsUpdateState = 'keep';
  if (previousHeight !== nextHeight || previousWidth !== nextWidth) {
    state = 'update';
  }

  const previousKeys = Object.keys(previousRest) as (keyof typeof previousRest)[];
  const nextKeys = Object.keys(nextRest);
  if (previousKeys.length !== nextKeys.length) {
    return 'create';
  }
  for (const key of previousKeys) {
    if (!Object.is(previousRest[key], nextRest[key as keyof typeof nextRest])) {
      return 'create';
    }
  }
  return state;
}

/** Deep value-compares two AlignedData arrays, so a new-but-equal `data` reference skips setData(). */
export function dataMatch(previousData: uPlot.AlignedData, nextData: uPlot.AlignedData): boolean {
  if (previousData.length !== nextData.length) return false;
  for (let seriesIdx = 0; seriesIdx < previousData.length; seriesIdx++) {
    const previousSeries = previousData[seriesIdx] as ArrayLike<number> | null;
    const nextSeries = nextData[seriesIdx] as ArrayLike<number> | null;
    if (!previousSeries || !nextSeries || previousSeries.length !== nextSeries.length) return false;
    for (let valueIdx = 0; valueIdx < previousSeries.length; valueIdx++) {
      if (previousSeries[valueIdx] !== nextSeries[valueIdx]) return false;
    }
  }
  return true;
}
