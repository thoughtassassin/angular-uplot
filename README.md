# angular-uplot

A zoneless, signals-based Angular wrapper around [uPlot](https://github.com/leeoniya/uPlot) - the
missing official-style Angular equivalent to uPlot's existing React, Vue, and Svelte wrappers.

This repo is a workspace with two projects:

- **`projects/angular-uplot/`** - the publishable library. Built with Angular 21, standalone
  components, and signal `input()`/`output()` throughout - no `NgModule`s, no `zone.js`.
- **`src/app/`** - a demo app consuming the library, with two example usages (see below).

## Quick start

```bash
npm install
npm run build:lib   # builds the library to dist/angular-uplot - do this before serving the demo
npm start            # ng serve demo
```

Open `http://localhost:4200`. The nav switches between the two demos:

- **Grafana-style panel** - `TimeSeriesPanel`, built *on top of* the library (not part of it):
  unit formatting, min/max/soft-bound scaling, connect-nulls, a Grafana-style tooltip/legend, and
  a controllable-vs-read-only settings UI.
- **Plain chart** - the same mock data rendered with `<uplot-chart>` directly: just
  `<uplot-series>`/`<uplot-axis>`/`<uplot-legend>` children, no settings form, no Grafana
  opinions - proof the library stands on its own outside a Grafana-style flow.

```bash
ng build angular-uplot   # library, Angular Package Format, output in dist/angular-uplot
ng build demo            # demo app, output in dist/demo
ng test angular-uplot    # library unit tests (Vitest)
ng test demo             # demo app unit tests (Vitest)
```

The demo imports the library via a `tsconfig.json` path mapping to `./dist/angular-uplot` - run
`ng build angular-uplot` again after changing library source before `ng serve demo` picks it up.

## Two ways to use the library

### 1. The primitive - parity with uPlot's other wrappers

```html
<uplot [options]="options" [data]="data" [height]="300" (created)="onCreated($event)" />
```

`Uplot` (`projects/angular-uplot/src/lib/primitive/uplot.ts`) is a thin, generic wrapper taking
the same `options: uPlot.Options` / `data: uPlot.AlignedData` shape as uPlot's official React, Vue,
and Svelte wrappers, with the same lifecycle contract:

- `created` / `deleted` outputs fire with the live `uPlot` instance, matching the other wrappers'
  `onCreate`/`onDelete`.
- `resetScales` (default `true`) controls whether a data update resets zoom/pan.
- An `optionsUpdateState()` check (ported from the same logic the other three wrappers share)
  distinguishes a width/height-only change - a cheap `setSize()` - from any other options change,
  which destroys and recreates the chart. A `dataMatch()` deep-equality check skips a redundant
  `setData()` when a new `data` reference carries unchanged values.
- `height`/`width` are dedicated inputs, independent of `options` - something none of the
  reference wrappers expose either, since they all expect size baked into the `options` object
  by the consumer. Leave `width` unset to auto-fill the container via `ResizeObserver` (something
  *none* of the reference wrappers do - they require the consumer to wire up their own resize
  listener).

Use this directly if you want full, uPlot-shaped control, same as you would in React/Vue/Svelte.

### 2. The declarative layer - compose a chart from components

```html
<uplot-chart [source]="frame">
  <uplot-series field="cpu" label="CPU" color="#73bf69">
    <uplot-connect-nulls [thresholdSeconds]="30" />
  </uplot-series>
  <uplot-series field="mem" label="Memory" color="#5794f2" />

  <uplot-axis scale="y" unit="percent">
    <uplot-soft-bounds [min]="0" [max]="100" />
  </uplot-axis>

  <uplot-legend />
  <uplot-plugin [plugin]="myPlugin" />
</uplot-chart>
```

`UplotChart` builds a `uPlot.Options`/`uPlot.AlignedData` pair from its content-projected children
and renders the primitive internally - no manual options object required.

- **Field-key matching, not position.** `<uplot-series field="...">` is matched against the
  adapted data by its `field` key, not by template order or array index - uPlot itself pairs
  `data[i]`/`series[i]` purely positionally, which is a real correctness hazard this avoids. A
  field with no matching `<uplot-series>` just uses the adapter's own label/color, or a palette
  fallback - `<uplot-series>` is opt-in per field, not a mandatory 1:1 declaration.
- **`applyMode`** (`'immediate'` default, or `'manual'`) controls whether every config change
  redraws right away, or stays staged until `apply()` is called - useful for a settings form
  where you don't want a destroy/recreate on every keystroke.
- `<uplot-series>` also takes `width` (line stroke width) and `showPoints` (point marker
  visibility) - both leave uPlot's own default untouched when unset.
- Children can come from a `@for` just as easily as being hand-written - `<uplot-series>` is
  matched by `field` key, so loop order doesn't matter, and `contentChildren()` reacts to
  children being added/removed by the loop the same way it reacts to any other input change.

### Extending the declarative layer with your own visualizations

`<uplot-series>`/`<uplot-axis>`/`<uplot-legend>`/`<uplot-plugin>` aren't special-cased inside
`<uplot-chart>` - they're just the first four implementations of one open contract:

```ts
export abstract class UplotOptionsContributor {
  /** Returns a modified uPlot.Options - don't mutate `options` in place. */
  abstract contribute(options: uPlot.Options, adapted: AdaptedFrame): uPlot.Options;
}
```

`<uplot-chart>` queries for *any* component that provides itself under this token
(`contentChildren(UplotOptionsContributor, { descendants: true })`) and folds them over a base
`uPlot.Options` (pre-seeded with one series entry per data field - default label/color from the
adapter or a palette fallback - and a placeholder x-axis) in content order. A brand new
visualization type - a bar series, a min/max band, cursor sync, anything uPlot's options surface
can express - is a component you write yourself, anywhere, with no library change:

```ts
@Component({
  selector: 'uplot-bar-series',
  providers: [{ provide: UplotOptionsContributor, useExisting: UplotBarSeries }],
  template: '',
})
export class UplotBarSeries extends UplotOptionsContributor {
  readonly field = input.required<string>();
  readonly color = input<string>();

  override contribute(options: uPlot.Options, adapted: AdaptedFrame): uPlot.Options {
    const fieldIdx = adapted.fields.findIndex((f) => f.key === this.field());
    if (fieldIdx === -1) return options;
    const series = [...(options.series ?? [])];
    series[fieldIdx + 1] = { ...series[fieldIdx + 1], paths: uPlot.paths.bars!({ size: [0.6, 100] }) };
    return { ...options, series };
  }
}
```

```html
<uplot-chart [source]="frame">
  <uplot-bar-series field="cpu" color="#73bf69" />
  <uplot-series field="mem" label="Memory" color="#5794f2" />
</uplot-chart>
```

`<uplot-bar-series>` is a real, working example of exactly this, not just a sketch - see
`src/app/plain-chart-demo/uplot-bar-series.ts`, used in the Plain chart demo alongside the
library's own `<uplot-series>` to render one field as bars and the other as a line, proving the
extension point works for a genuinely new visualization type, not just the library's own internals.

The same open pattern goes one level deeper, for components nested *inside* a contributor -
`UplotConnectNulls` inside `<uplot-series>`, `UplotSoftBounds` inside `<uplot-axis>`. These aren't
hardcoded references either:

```ts
export abstract class UplotSeriesModifier {
  abstract modify(series: Partial<uPlot.Series>): Partial<uPlot.Series>;
}

export abstract class UplotAxisModifier {
  abstract modify(parts: { axis: Partial<uPlot.Axis>; scale: Partial<uPlot.Scale> }): typeof parts;
}
```

`<uplot-series>` queries `contentChildren(UplotSeriesModifier)` and `<uplot-axis>` queries
`contentChildren(UplotAxisModifier)` - generic, not specific to `UplotConnectNulls`/
`UplotSoftBounds`. Write your own nested modifier (a dash pattern, a custom fill) the same
`useExisting` way and nest it inside the library's own `<uplot-series>`/`<uplot-axis>`, no fork
required. One wrinkle worth knowing if you write an axis modifier that affects the scale's range
(like `UplotSoftBounds` does): *wrap* `parts.scale.range` (call the previous function from inside
your new one) rather than replace it outright, so it composes with other range-affecting
modifiers instead of clobbering them.

### The data adapter pattern

`UplotChart` doesn't require any particular data shape. `source` + `adapter` work together:

```ts
export type DataAdapter<T> = (source: T) => AdaptedFrame; // { data, fields }
```

`dataFrameAdapter` (the default) accepts `DataFrame` - a backend-agnostic shape modeled on
Grafana's own `DataFrame`: one table of same-length columns (`fields`), each field self-contained
with its own `name`/`type`/`config`/`values`. Pass your own `DataAdapter<T>` for any other shape
(a REST response, a Prometheus result, ...) - `<uplot-chart [source]="myData" [adapter]="myAdapter">`.

## `TimeSeriesPanel` - the Grafana-style demo, built entirely on `<uplot-chart>`

`src/app/viz/timeseries/` is a real example of dogfooding the declarative layer, not a second
implementation alongside it. `TimeSeriesPanel`'s template iterates the frame's fields with `@for`
to generate one `<uplot-series>` per field, and binds the settings form's live state straight onto
`<uplot-axis>`/`<uplot-soft-bounds>`/`<uplot-connect-nulls>`/`<uplot-legend>`/`<uplot-plugin>` -
there's no hand-built `uPlot.Options` anywhere in the demo. `panel-options.ts` shrank down to just
the `TimeSeriesPanelOptions` settings interface; `toUplotOptions()`/`yRange()`/`axisSize()`/
`gapsThreshold()` and `frame-to-chart.ts` are gone entirely, since `<uplot-axis>`,
`<uplot-soft-bounds>`, and `<uplot-connect-nulls>` already implement the same logic in the
library. The one piece of real app-specific logic left is `resolveConnectNulls()` in
`time-series-panel.ts`, which resolves a field's own `connectNulls` override (from
`field.config.custom`) against the panel-wide setting before handing it to `<uplot-connect-nulls>`.

This dogfooding pass is also what surfaced the need for `<uplot-series>`'s `width`/`showPoints`
inputs above - the panel's line styling (2px, no point markers) had no declarative way to express
itself until they were added.

To add a new panel option: add the field to `TimeSeriesPanelOptions` (`panel-options.ts`), bind it
onto the relevant `<uplot-*>` child in `time-series-panel.html`, and add a control to the settings
form the same way the existing ones work.

## Known limitations / possible next steps

- Single shared y-axis/unit per chart - no per-field unit or multi-axis support (Grafana does
  this when fields have different units); `<uplot-axis>` could extend to multiple scale keys.
- No multi-panel cursor sync or zoom-to-select built in yet - both are expressible today as a new
  `UplotOptionsContributor` (e.g. `<uplot-cursor-sync key="...">` setting `options.cursor.sync`),
  just not shipped as part of the library yet.
- No real backend integration in the demo - `DataFrame` (or a custom `DataAdapter`) is the
  intended integration seam for a real datasource.
