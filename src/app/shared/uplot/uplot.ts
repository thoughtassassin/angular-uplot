import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import uPlot from 'uplot';

@Component({
  selector: 'app-uplot',
  imports: [],
  templateUrl: './uplot.html',
  styleUrl: './uplot.sass',
})
export class Uplot {
  private readonly chartEl = viewChild.required<ElementRef<HTMLDivElement>>('chart');

  readonly options = input.required<uPlot.Options>();
  readonly data = input.required<uPlot.AlignedData>();

  readonly ready = output<uPlot>();

  private chart?: uPlot;
  private resizeObserver?: ResizeObserver;

  constructor() {
    afterNextRender(() => {
      const el = this.chartEl().nativeElement;
      this.chart = new uPlot(untracked(this.options), untracked(this.data), el);

      this.resizeObserver = new ResizeObserver(([entry]) => {
        this.chart?.setSize({
          width: entry.contentRect.width,
          height: untracked(this.options).height,
        });
      });
      this.resizeObserver.observe(el);

      this.ready.emit(this.chart);
    });

    effect(() => {
      const data = this.data();
      this.chart?.setData(data);
    });

    effect(() => {
      const options = this.options();
      if (!this.chart) return;
      this.chart.destroy();

      const el = this.chartEl().nativeElement;
      this.chart = new uPlot(options, untracked(this.data), el);

      // options.width is just an initial value - resync to the container's actual
      // width immediately, since recreating doesn't re-trigger the resize observer
      this.chart.setSize({ width: el.clientWidth, height: options.height });
    });

    inject(DestroyRef).onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.chart?.destroy();
    });
  }
}
