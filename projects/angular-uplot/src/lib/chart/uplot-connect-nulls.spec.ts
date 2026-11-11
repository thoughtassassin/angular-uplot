import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import uPlot from 'uplot';
import { DataFrame } from '../data/data-frame';
import { UplotChart } from './uplot-chart';
import { UplotConnectNulls } from './uplot-connect-nulls';
import { UplotSeries } from './uplot-series';

const testFrame: DataFrame = {
  fields: [
    { name: 'time', type: 'time', values: [0, 60_000] },
    { name: 'cpu', type: 'number', values: [1, null] },
  ],
};

@Component({
  imports: [UplotChart, UplotSeries, UplotConnectNulls],
  template: `
    <uplot-chart [source]="frame">
      <uplot-series field="cpu">
        <uplot-connect-nulls [thresholdMs]="5000" />
      </uplot-series>
    </uplot-chart>
  `,
})
class HostComponent {
  readonly frame = testFrame;
}

function stubUplot(secondsAtPx: Record<number, number>): uPlot {
  return { posToVal: (px: number) => secondsAtPx[px] } as unknown as uPlot;
}

describe('UplotConnectNulls', () => {
  it('compares the gap width in milliseconds against thresholdMs, not raw scale units', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const chart = fixture.debugElement.children[0].componentInstance as UplotChart<DataFrame>;
    const gaps = chart.options().series![1]!.gaps as Extract<uPlot.Series.GapsRefiner, (...args: never[]) => unknown>;

    // uPlot's own x-scale is in seconds (the adapter converts epoch ms to epoch seconds).
    // Gap A: 0 -> 3s = 3000ms, narrower than the 5000ms threshold - should be bridged (dropped).
    // Gap B: 10s -> 20s = 10000ms, wider - should stay broken (kept).
    const u = stubUplot({ 0: 0, 1: 3, 2: 10, 3: 20 });
    const result = gaps(u, 1, 0, 1, [
      [0, 1],
      [2, 3],
    ]);

    expect(result).toEqual([[2, 3]]);
  });
});
