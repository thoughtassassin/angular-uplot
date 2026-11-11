import {
  Component,
  afterNextRender,
  computed,
  contentChildren,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import uPlot from 'uplot';
import { Uplot } from '../primitive/uplot';
import { DataAdapter, FieldMeta } from '../data/data-adapter';
import { dataFrameAdapter } from '../data/data-frame-adapter';
import { DataFrame } from '../data/data-frame';
import { defaultPalette } from '../shared/palette';
import { UplotOptionsContributor } from './uplot-options-contributor';

/** Deep-equal on field metadata, so a value-only data refresh (same keys/labels/colors/custom, different values) compares equal. */
function fieldsEqual(a: FieldMeta[], b: FieldMeta[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Compared per-entry with `Object.is`, matching UplotOptionsContributor.dependsOn's own contract. */
function factsEqual(a: unknown[], b: unknown[]): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}

/**
 * Declarative composition layer over the primitive Uplot wrapper: build a chart by nesting
 * any UplotOptionsContributor - <uplot-series>/<uplot-axis>/<uplot-legend>/<uplot-plugin> are
 * the library's own, but any component (yours or a third party's) that provides itself under
 * that token is folded in the same way, in content order. Works with any data shape via
 * `adapter` - defaults to the built-in `dataFrameAdapter` for the common DataFrame case.
 *
 * <uplot-series> is matched to data by its `field` key, not template/array position - fields
 * with no matching <uplot-series> just use the adapter's own label/color, or a palette fallback,
 * seeded here before any contributor runs.
 */
@Component({
  selector: 'uplot-chart',
  imports: [Uplot],
  template: `
    @if (viewReady()) {
      <uplot
        [options]="options()"
        [data]="data()"
        [height]="height()"
        [width]="width()"
        [resetScales]="resetScales()"
        (created)="created.emit($event)"
        (deleted)="deleted.emit($event)"
      />
    }
  `,
})
export class UplotChart<T = DataFrame> {
  readonly source = input.required<T>();
  readonly adapter = input<DataAdapter<T>>(dataFrameAdapter as unknown as DataAdapter<T>);

  /** 'immediate' (default): every config change redraws right away. 'manual': changes are staged until apply() is called - avoids a rebuild on every keystroke while editing a draft config. */
  readonly applyMode = input<'immediate' | 'manual'>('immediate');

  readonly height = input<number>();
  readonly width = input<number>();
  readonly resetScales = input(true);

  readonly created = output<uPlot>();
  readonly deleted = output<uPlot>();

  private readonly contributors = contentChildren(UplotOptionsContributor, { descendants: true });

  private readonly adapted = computed(() => this.adapter()(this.source()));

  readonly data = computed<uPlot.AlignedData>(() => this.adapted().data);

  // Structural gates for liveOptions below: both read `adapted()` (so they re-run on every
  // refresh) but their *output* is compared with a custom `equal`, so a value-only refresh -
  // same field keys/labels/colors/custom, and no contributor's dependsOn() fact changed - keeps
  // the same cached reference instead of propagating a change. Every contributor otherwise
  // builds fresh objects on every run (fresh series/axes entries, fresh closures), so without
  // this, optionsUpdateState (reference-equality per top-level key) would see a change on every
  // single refresh and destroy/recreate the chart - losing hover/cursor state and flickering.
  private readonly fields = computed(() => this.adapted().fields, { equal: fieldsEqual });

  private readonly contributorFacts = computed(
    () => this.contributors().map((contributor) => contributor.dependsOn?.(this.adapted())),
    { equal: factsEqual },
  );

  private readonly liveOptions = computed<uPlot.Options>(() => {
    // Tracked reads: this is what actually determines whether liveOptions rebuilds. Reading the
    // full `adapted()` here instead (which changes - new reference - on every refresh, data
    // included) would defeat the memoization above.
    this.fields();
    this.contributorFacts();

    const adapted = untracked(this.adapted);

    const base: uPlot.Options = {
      // placeholder - the primitive's own height/width inputs are the real levers, see template above
      width: 800,
      height: 300,
      series: [
        {},
        ...adapted.fields.map((field, i) => ({
          label: field.label ?? field.key,
          stroke: field.color ?? defaultPalette[i % defaultPalette.length],
        })),
      ],
      // uPlot defaults an axis's side (top/bottom/left/right) from its array index, not from
      // `scale` - a y-axis entry at index 0 renders on the bottom regardless of its scale field.
      // This placeholder keeps any contributed axes at the indices uPlot expects them at.
      axes: [{}],
    };

    return this.contributors().reduce((options, contributor) => contributor.contribute(options, adapted), base);
  });

  // placeholder until the constructor's effect below runs - liveOptions() can't be read yet
  // here, since required inputs like `source` aren't bound until after construction.
  private readonly appliedOptions = signal<uPlot.Options>({ width: 800, height: 300, series: [] });

  readonly options = this.appliedOptions.asReadonly();

  // content-projected contributors (e.g. <uplot-series> generated by a parent's @for) can appear
  // in contributors() before their own required inputs are bound - reading liveOptions() that
  // early throws. Gate the first read on afterNextRender, which only fires once a full render
  // pass (including content children's bindings) has completed - the same guarantee the
  // primitive wrapper relies on for its own first read.
  //
  // The template above also gates <uplot> itself behind this signal, not just its options
  // input: a child's afterNextRender fires before its parent's (bottom-up, same as
  // ngAfterViewInit), so if <uplot> existed from the first render pass, its own afterNextRender
  // would run - and construct a real chart against the placeholder below - before this
  // component's afterNextRender ever gets a chance to seed the real options. Not creating
  // <uplot> until viewReady is true means its first-ever render already sees the real value,
  // so it only ever constructs the chart once.
  protected readonly viewReady = signal(false);

  constructor() {
    afterNextRender(() => {
      // Seed synchronously here, not only via the effect below, so <uplot> (created once this
      // flips viewReady and the template above reflects it) never has a placeholder to see.
      if (this.applyMode() === 'immediate') {
        this.appliedOptions.set(untracked(this.liveOptions));
      }
      this.viewReady.set(true);
    });

    effect(() => {
      if (!this.viewReady()) return;

      const next = this.liveOptions();
      if (this.applyMode() === 'immediate') {
        this.appliedOptions.set(next);
      }
    });
  }

  /** Commits the current draft config in 'manual' apply mode. No-op in 'immediate' mode, where changes are already applied. */
  apply(): void {
    this.appliedOptions.set(this.liveOptions());
  }
}
