# angular-uplot

A zoneless, signals-based Angular wrapper around [uPlot](https://github.com/leeoniya/uPlot), plus a reusable
Grafana-style time series panel built on top of it: unit formatting, min/max/soft-bound scaling, connect-nulls
(never/always/threshold, with per-series overrides), a custom Grafana-style tooltip and legend, and a
controllable-vs-read-only settings UI.

Built with Angular 21, standalone components, and signal `input()`/`output()` throughout - no `NgModule`s, no
`zone.js`.

## Quick start

```bash
npm install
ng serve
```

Open `http://localhost:4200`. The demo (`App` → `Panel`) renders two mock series (CPU/Memory) with the full
settings panel so you can see every option live.

```bash
ng build   # production build, output in dist/
ng test    # unit tests (Vitest)
```

## Architecture

The project is layered so each piece only knows about the layer directly below it:

```
TimeSeriesFrame  (backend-agnostic data: fields + column-major values)
      ↓ frameToChart()
{ data, series, seriesOverrides }
      ↓
PanelOptions  (Grafana-style panel config: unit, min/max, connectNulls, tooltipMode, showLegend)
      ↓ toUplotOptions()
uPlot.Options
      ↓
Uplot  (generic Angular wrapper - knows nothing about panels, units, or Grafana)
      ↓
Panel  (reusable component: settings form + Uplot, driven by TimeSeriesFrame + PanelOptions)
```

### `src/app/uplot/uplot.ts` - the wrapper

A thin, generic Angular wrapper around the uPlot constructor. Takes `options: uPlot.Options` and
`data: uPlot.AlignedData` as signal inputs, and:

- Creates the chart in `afterNextRender` (DOM needs to exist first).
- Cheap-updates data via `setData()` when the `data` input changes.
- Destroys and recreates the whole chart when the `options` input changes (uPlot has no `setOptions`), then
  immediately resyncs to the container's actual width via `ResizeObserver`/`clientWidth` - recreating doesn't
  re-trigger the observer's initial-fire behavior, so this avoids a "shrinks to the last hardcoded width" bug.
- Runs entirely outside `NgZone` concerns since the app is zoneless - no `runOutsideAngular` needed.

It has no idea what a "panel," "unit," or "Grafana" is. Any uPlot chart can use it directly.

### `src/app/uplot/panel-options.ts` - the Grafana semantics layer

`PanelOptions` (`unit`, `min`/`max`, `softMin`/`softMax`, `connectNulls`, `tooltipMode`, `showLegend`) plus
`toUplotOptions(panel, base, seriesOverrides?)`, which composes those into a real `uPlot.Options`:

- **`unit`** drives a formatter used for the y-axis ticks and the tooltip.
- **`min`/`max`** hard-clamp the y-scale; **`softMin`/`softMax`** only pull the auto-range toward a bound
  without clamping past what the data actually needs (Grafana's "soft" semantics).
- **`connectNulls`**: `false` leaves gaps broken, `true` bridges all of them, a `number` bridges only gaps
  narrower than that many seconds (via a custom `series.gaps` refiner - uPlot only calls it when
  `spanGaps: false`).
- **`seriesOverrides`** mirrors Grafana's `fieldConfig.defaults`/`overrides` split - per-series overrides
  (currently `connectNulls`) win over the panel-wide default.
- Also fixes a real uPlot gotcha: the y-axis gutter defaults to a fixed 50px, not something measured from your
  actual labels, so long formatted values (e.g. `"12.3 GB"`) get clipped. `axisSize()` measures the widest
  rendered tick each layout pass and sizes the gutter to fit it.

### `src/app/uplot/time-series-frame.ts` - the data contract

`TimeSeriesFrame` is a simplified version of Grafana's own `DataFrame`: `fields[]` (first one always time, in
epoch **milliseconds**) + column-major `values[]`. `frameToChart(frame)` converts ms→s, builds `uPlot.Series[]`
from each field's `label`/`color` (falling back to a default palette), and produces per-series
`PanelOptions` overrides from each field's `config`.

This is the intended integration point for a real backend: write one adapter per datasource
(`xToFrame(response): TimeSeriesFrame`) and nothing else changes. Column-major was chosen deliberately - it's
what Grafana's own datasource plugins return, and it maps onto `uPlot.AlignedData` almost directly.

### `src/app/uplot/plugins/tooltip.ts` - the tooltip

A uPlot plugin (hooks-based, no framework dependency) rendering a Grafana-style tooltip: time header, one row
per series with a colored marker and value, bolding whichever series is pixel-closest to the cursor. Supports
`mode: 'single' | 'all'`; `panel-options.ts` skips adding the plugin entirely when `tooltipMode: 'none'`.

### `src/app/panel/panel.ts` - the reusable panel

Combines everything above into one component: `frame` (required input) drives the chart, `options` (optional
input, defaults to a sensible `PanelOptions`) seeds its configuration via `linkedSignal` - which means it's
both a controlled and uncontrolled component. Leave `options` unset and the built-in settings form lets a user
edit unit/min-max/connect-nulls/tooltip/legend locally. Pass `options` from a parent and set
`showControls: false` for a locked, externally-driven read-only viewer (e.g. a saved dashboard panel).

### `src/app/app.ts` - the demo shell

Owns a mock `TimeSeriesFrame` (`makeFrame()`, standing in for a real backend call) and a "Show panel controls"
toggle to demonstrate both `Panel` modes.

## Adding a new panel option

1. Add the field to `PanelOptions` in `panel-options.ts`.
2. Handle it in `toUplotOptions()` - map it onto the relevant part of `uPlot.Options`.
3. If it should be per-series overridable, read it via `seriesOverrides[i]?.yourField ?? panel.yourField`.
4. Add a control for it to `panel.html`/`panel.ts` (a setter that does
   `this.panelOptions.update((p) => ({ ...p, yourField: value }))`).

## Known limitations / possible next steps

- Single shared y-axis/unit per panel - no per-field unit or multi-axis support (Grafana does this when fields
  have different units).
- No multi-panel cursor sync (uPlot supports this natively via `cursor.sync`).
- No zoom-to-select.
- The demo has no real backend integration - `time-series-frame.ts` is the intended seam; see its doc comment
  for how a datasource adapter (Prometheus, Pinot, a REST API, ...) would plug in.
