import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import uPlot from 'uplot';
import { dataMatch, optionsUpdateState } from './options-update-state';

/**
 * Generic Angular wrapper around the uPlot constructor - the parity layer matching uPlot's
 * official React/Vue/Svelte wrappers' contract (options/data in, create/delete lifecycle out).
 * Knows nothing about panels, units, or Grafana; any uPlot chart can use it directly.
 */
@Component({
  selector: 'uplot',
  imports: [],
  templateUrl: './uplot.html',
  styleUrl: './uplot.sass',
})
export class Uplot {
  private readonly chartEl = viewChild.required<ElementRef<HTMLDivElement>>('chart');

  readonly options = input.required<uPlot.Options>();
  readonly data = input.required<uPlot.AlignedData>();
  /** Chart height in px. Leave unset to use whatever height is already in `options`. */
  readonly height = input<number>();
  /** Fixed chart width in px. Leave unset to auto-fill the container's width via ResizeObserver. */
  readonly width = input<number>();
  /** Whether a data update resets zoom/pan (setData(data, true)) or preserves it (setData(data, false) + redraw()). */
  readonly resetScales = input(true);

  readonly created = output<uPlot>();
  readonly deleted = output<uPlot>();

  private readonly effectiveHeight = computed(() => this.height() ?? this.options().height);

  private readonly effectiveOptions = computed<uPlot.Options>(() => ({
    ...this.options(),
    height: this.effectiveHeight(),
    ...(this.width() != null ? { width: this.width() } : {}),
  }));

  private chart?: uPlot;
  private resizeObserver?: ResizeObserver;
  private lastOptions?: uPlot.Options;
  private lastData?: uPlot.AlignedData;

  constructor() {
    afterNextRender(() => {
      const el = this.chartEl().nativeElement;
      this.lastOptions = untracked(this.effectiveOptions);
      this.lastData = untracked(this.data);
      this.chart = new uPlot(this.lastOptions, this.lastData, el);

      this.resizeObserver = new ResizeObserver(([entry]) => {
        if (this.width() != null) return;
        this.chart?.setSize({
          width: entry.contentRect.width,
          height: this.effectiveHeight(),
        });
      });
      this.resizeObserver.observe(el);

      this.created.emit(this.chart);
    });

    effect(() => {
      const options = this.effectiveOptions();
      if (!this.chart || !this.lastOptions) return;

      const state = optionsUpdateState(this.lastOptions, options);
      this.lastOptions = options;

      if (state === 'create') {
        this.deleted.emit(this.chart);
        this.chart.destroy();

        const el = this.chartEl().nativeElement;
        this.chart = new uPlot(options, untracked(this.data), el);
        // options.width is just an initial value - resync to the container's actual width
        // immediately, since recreating doesn't re-trigger the resize observer's initial fire.
        this.chart.setSize({
          width: this.width() ?? el.clientWidth,
          height: options.height,
        });
        this.created.emit(this.chart);
      } else if (state === 'update') {
        this.chart.setSize({
          width: this.width() ?? this.chartEl().nativeElement.clientWidth,
          height: options.height,
        });
      }
    });

    effect(() => {
      const data = this.data();
      if (!this.chart || !this.lastData) return;
      if (dataMatch(this.lastData, data)) return;

      this.lastData = data;
      if (this.resetScales()) {
        this.chart.setData(data, true);
      } else {
        this.chart.setData(data, false);
        this.chart.redraw();
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.resizeObserver?.disconnect();
      if (this.chart) {
        this.deleted.emit(this.chart);
        this.chart.destroy();
      }
    });
  }
}
