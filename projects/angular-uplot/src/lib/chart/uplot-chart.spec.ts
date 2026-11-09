import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import uPlot from 'uplot';
import { AdaptedFrame } from '../data/data-adapter';
import { DataFrame } from '../data/data-frame';
import { UplotChart } from './uplot-chart';
import { UplotOptionsContributor } from './uplot-options-contributor';
import { UplotSeries } from './uplot-series';

const testFrame: DataFrame = {
  fields: [
    { name: 'time', type: 'time', values: [0, 60_000] },
    { name: 'cpu', type: 'number', values: [1, 2] },
    { name: 'memory', type: 'number', values: [10, 20] },
  ],
};

@Component({
  imports: [UplotChart, UplotSeries],
  // declared out of data order on purpose - field-key matching should make this irrelevant
  template: `
    <uplot-chart [source]="frame">
      <uplot-series field="memory" color="blue" />
      <uplot-series field="cpu" color="red" />
    </uplot-chart>
  `,
})
class HostComponent {
  readonly frame = testFrame;
}

describe('UplotChart', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
  });

  it('matches <uplot-series> to data by field key, independent of declaration order', () => {
    const chart = fixture.debugElement.children[0].componentInstance as UplotChart<DataFrame>;
    const series = chart.options().series!;

    expect(series[1]!.stroke).toBe('red'); // cpu is data[1], declared second in the template
    expect(series[2]!.stroke).toBe('blue'); // memory is data[2], declared first in the template
  });
});

// A third-party-style contributor, outside the library's own four - never referenced by
// UplotChart's source, only discovered through the shared UplotOptionsContributor token. This is
// the actual test of the extension point, not just of UplotSeries/UplotAxis/etc. themselves.
@Component({
  selector: 'stub-contributor',
  providers: [{ provide: UplotOptionsContributor, useExisting: StubContributor }],
  template: '',
})
class StubContributor extends UplotOptionsContributor {
  override contribute(options: uPlot.Options, _adapted: AdaptedFrame): uPlot.Options {
    return { ...options, title: 'contributed by a third party' };
  }
}

@Component({
  imports: [UplotChart, StubContributor],
  template: `<uplot-chart [source]="frame"><stub-contributor /></uplot-chart>`,
})
class ExtensibilityHostComponent {
  readonly frame = testFrame;
}

describe('UplotChart extensibility', () => {
  it('folds in any UplotOptionsContributor, not just the library-defined ones', async () => {
    await TestBed.configureTestingModule({ imports: [ExtensibilityHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ExtensibilityHostComponent);
    await fixture.whenStable();

    const chart = fixture.debugElement.children[0].componentInstance as UplotChart<DataFrame>;
    expect(chart.options().title).toBe('contributed by a third party');
  });
});
