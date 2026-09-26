# angular-uplot

A zoneless, signals-based Angular wrapper around [uPlot](https://github.com/leeoniya/uPlot), plus a reusable
Grafana-style time series panel built on top of it: unit formatting, min/max/soft-bound scaling, connect-nulls
(never/always/threshold, with per-series overrides), a custom Grafana-style tooltip and legend, and a
controllable-vs-read-only settings UI.

Built with Angular 21, standalone components, and signal `input()`/`output()` throughout - no `NgModule`s, no
`zone.js`. Structured to support additional visualization types (bar chart, pie chart, stat, ...) alongside
time series, sharing one backend-agnostic data contract - see [Architecture](#architecture).

## Quick start

```bash
npm install
ng serve
```

Open `http://localhost:4200`. The demo (`App` → `TimeSeriesPanel`) renders two mock series (CPU/Memory) with
the full settings panel so you can see every option live.

```bash
ng build   # production build, output in dist/
ng test    # unit tests (Vitest)
```

## Architecture

```
src/app/
  data/              - the shared, visualization-agnostic data contract
  shared/            - reusable pieces with no visualization-specific opinions
  viz/
    timeseries/      - everything specific to rendering a time series panel
  app.ts             - demo shell
```

Each layer only knows about the layer directly below it:

```
DataFrame  (backend-agnostic data: fields, each self-contained with its own values)
      ↓ frameToChart()                              [viz/timeseries/frame-to-chart.ts]
{ data, series, seriesOverrides }
      ↓
TimeSeriesPanelOptions  (unit, min/max, connectNulls, tooltipMode, showLegend)
      ↓ toUplotOptions()                             [viz/timeseries/panel-options.ts]
uPlot.Options
      ↓
Uplot  (generic Angular wrapper - knows nothing about panels, units, or Grafana)  [shared/uplot/]
      ↓
TimeSeriesPanel  (settings form + Uplot, driven by DataFrame + TimeSeriesPanelOptions)
```

### `src/app/data/data-frame.ts` - the shared data contract

`DataFrame` is modeled directly on Grafana's own `DataFrame`: one table of same-length columns (`fields`),
where each `DataField` is self-contained with its own `name`, `type`, `config`, and `values` - not a separate
frame-level `values` array that has to be kept in sync with `fields` by index (an easy source of bugs the
earlier version of this had). `fields[0]` is conventionally the time field, in epoch **milliseconds**.

`FieldConfig` only carries what's genuinely universal across *any* visualization - `label`, `color` - plus a
loosely-typed `custom` bag for whatever a specific visualization needs per-field (e.g. a time series field's
`connectNulls` override). This mirrors Grafana's own `field.config.custom`: the shared contract stays generic,
and each `viz/<type>/` interprets `custom` however it needs to, so `data-frame.ts` never has to know time
series, bar chart, and pie chart config apart.

This is the intended integration point for a real backend: write one adapter per datasource
(`xToFrame(response): DataFrame`) and nothing else changes.

### `src/app/shared/` - visualization-agnostic building blocks

- **`units.ts`** - the `Unit` type and its formatters (`none`/`percent`/`bytes`/`short`). Any visualization
  that displays formatted numbers can reuse this.
- **`palette.ts`** - the default series color palette.
- **`uplot/uplot.ts`** - a thin, generic Angular wrapper around the uPlot constructor. Takes
  `options: uPlot.Options` and `data: uPlot.AlignedData` as signal inputs and:
  - Creates the chart in `afterNextRender` (DOM needs to exist first).
  - Cheap-updates data via `setData()` when the `data` input changes.
  - Destroys and recreates the whole chart when the `options` input changes (uPlot has no `setOptions`), then
    immediately resyncs to the container's actual width via `ResizeObserver`/`clientWidth` - recreating
    doesn't re-trigger the observer's initial-fire behavior, so this avoids a "shrinks to the last hardcoded
    width" bug.

  It has no idea what a "panel," "unit," or "time series" is - any uPlot chart can use it directly, including
  a future bar chart (uPlot supports bar rendering natively via its path builders).
- **`value-scale-options.ts`** - `ValueScaleOptions` (`unit`, `min`/`max`, `softMin`/`softMax`): the subset of
  options common to *any* visualization with a numeric value axis. Modeled on Grafana's "standard field
  options," which are genuinely shared across every one of Grafana's panel types - unlike tooltip behavior or
  connect-nulls, which stay defined per visualization since they're specific to how that visualization renders.

### `src/app/viz/timeseries/` - the time series visualization

- **`panel-options.ts`** - `TimeSeriesPanelOptions extends ValueScaleOptions`, adding `connectNulls`,
  `tooltipMode`, and `showLegend`, plus `toUplotOptions(panel, base, seriesOverrides?)`, which composes all of
  it into a real `uPlot.Options`:
  - **`unit`** drives a formatter used for the y-axis ticks and the tooltip.
  - **`min`/`max`** hard-clamp the y-scale; **`softMin`/`softMax`** only pull the auto-range toward a bound
    without clamping past what the data actually needs (Grafana's "soft" semantics).
  - **`connectNulls`**: `false` leaves gaps broken, `true` bridges all of them, a `number` bridges only gaps
    narrower than that many seconds (via a custom `series.gaps` refiner - uPlot only calls it when
    `spanGaps: false`).
  - **`seriesOverrides`** mirrors Grafana's `fieldConfig.defaults`/`overrides` split - per-series overrides
    win over the panel-wide default.
  - Also fixes a real uPlot gotcha: the y-axis gutter defaults to a fixed 50px, not something measured from
    your actual labels, so long formatted values (e.g. `"12.3 GB"`) get clipped. `axisSize()` measures the
    widest rendered tick each layout pass and sizes the gutter to fit it.
- **`frame-to-chart.ts`** - `frameToChart(frame: DataFrame)` converts ms→s, builds `uPlot.Series[]` from each
  field's `label`/`color` (falling back to the default palette), and reads `field.config.custom.connectNulls`
  to produce per-series `TimeSeriesPanelOptions` overrides.
- **`plugins/tooltip.ts`** - a uPlot plugin (hooks-based, no framework dependency) rendering a Grafana-style
  tooltip: time header, one row per series with a colored marker and value, bolding whichever series is
  pixel-closest to the cursor. Supports `mode: 'single' | 'all'`; `panel-options.ts` skips adding the plugin
  entirely when `tooltipMode: 'none'`.
- **`time-series-panel.ts`** - combines everything above into one component: `frame` (required input) drives
  the chart, `options` (optional input, defaults to a sensible `TimeSeriesPanelOptions`) seeds its
  configuration via `linkedSignal` - which means it's both a controlled and uncontrolled component. Leave
  `options` unset and the built-in settings form lets a user edit unit/min-max/connect-nulls/tooltip/legend
  locally. Pass `options` from a parent and set `showControls: false` for a locked, externally-driven
  read-only viewer (e.g. a saved dashboard panel).

### `src/app/app.ts` - the demo shell

Owns a mock `DataFrame` (`makeFrame()`, standing in for a real backend call) and a "Show panel controls" toggle
to demonstrate both `TimeSeriesPanel` modes.

## Adding a new panel option (to the existing time series viz)

1. Add the field to `TimeSeriesPanelOptions` in `viz/timeseries/panel-options.ts`.
2. Handle it in `toUplotOptions()` - map it onto the relevant part of `uPlot.Options`.
3. If it should be per-series overridable, read it via `seriesOverrides[i]?.yourField ?? panel.yourField`, and
   have `frame-to-chart.ts` populate it from `field.config.custom` if it should be settable per-field.
4. Add a control for it to `time-series-panel.html`/`.ts` (a setter that does
   `this.panelOptions.update((p) => ({ ...p, yourField: value }))`).

## Adding a new visualization type

`data/data-frame.ts` and `shared/` are deliberately visualization-agnostic - a new type shouldn't need to
change either. Add a new `viz/<type>/` folder following the same internal shape as `viz/timeseries/`:

- Its own `<Type>PanelOptions` interface - don't extend or reuse `TimeSeriesPanelOptions` itself; a pie chart's
  options (donut, legend placement) have nothing in common with a time series' (connect-nulls, tooltip mode).
  If the new type has a numeric value axis, do extend `shared/value-scale-options.ts`'s `ValueScaleOptions`
  the same way `TimeSeriesPanelOptions` does, rather than redefining `unit`/`min`/`max` again - that's exactly
  the part of the options shape that's meant to be shared. A pie chart has no axis, so it wouldn't extend it.
- Its own frame-consuming function analogous to `frameToChart` - it can reduce or reshape the `DataFrame`
  however that visualization needs (e.g. a stat panel might reduce each field to a single last/mean/max
  value instead of a whole series).
- Its own panel component analogous to `TimeSeriesPanel`, with a distinct selector (e.g. `app-barchart-panel`)
  so multiple visualization types can coexist in the same app without selector collisions.
- Reuse `shared/units.ts` and `shared/palette.ts` where relevant. Reuse `shared/uplot/uplot.ts` directly if the
  new type also renders through uPlot (bar charts can - uPlot supports bar rendering natively); if not (e.g. a
  pie chart), it needs its own renderer, since `Uplot` is specifically a uPlot wrapper, not a generic chart
  abstraction.

Once more than one visualization type exists, a small dispatcher component (e.g.
`<app-viz [type]="'timeseries'" [frame]="..." [options]="...">` that looks up the right panel by `type`) is the
natural next step - that becomes the one component a dashboard actually drops in per panel.

## Known limitations / possible next steps

- Only one visualization type (time series) is implemented today - see "Adding a new visualization type" above.
- Single shared y-axis/unit per time series panel - no per-field unit or multi-axis support (Grafana does this
  when fields have different units).
- No multi-panel cursor sync (uPlot supports this natively via `cursor.sync`).
- No zoom-to-select.
- The demo has no real backend integration - `data/data-frame.ts` is the intended seam; see its doc comment
  for how a datasource adapter (Prometheus, Pinot, a REST API, ...) would plug in.
