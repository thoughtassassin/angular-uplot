import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import uPlot from 'uplot';
import { AdaptedFrame } from '../data/data-adapter';
import { DataFrame } from '../data/data-frame';
import { UplotAxis } from './uplot-axis';
import { UplotAxisModifier, UplotAxisParts } from './uplot-axis-modifier';
import { UplotChart } from './uplot-chart';
import { UplotOptionsContributor } from './uplot-options-contributor';
import { UplotSeries } from './uplot-series';
import { UplotSeriesModifier } from './uplot-series-modifier';

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

@Component({
  imports: [UplotChart, UplotSeries],
  template: `
    <uplot-chart
      [source]="frame()"
      (created)="createdCount = createdCount + 1"
      (deleted)="deletedCount = deletedCount + 1"
    >
      <uplot-series field="cpu" color="red" />
      <uplot-series field="memory" color="blue" />
    </uplot-chart>
  `,
})
class RefreshHostComponent {
  readonly frame = signal<DataFrame>(testFrame);
  createdCount = 0;
  deletedCount = 0;
}

describe('UplotChart mount', () => {
  it('creates the chart exactly once, against real options - never a placeholder followed by a rebuild', async () => {
    await TestBed.configureTestingModule({ imports: [RefreshHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(RefreshHostComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.createdCount).toBe(1);
    expect(fixture.componentInstance.deletedCount).toBe(0);
  });
});

describe('UplotChart refresh', () => {
  it('does not destroy/recreate the chart when a refreshed source has the same fields, different values', async () => {
    await TestBed.configureTestingModule({ imports: [RefreshHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(RefreshHostComponent);
    await fixture.whenStable();

    const host = fixture.componentInstance;
    const chart = fixture.debugElement.children[0].componentInstance as UplotChart<DataFrame>;
    const optionsBefore = chart.options();

    // same field keys/labels/colors as testFrame, different values - a refresh, not a structural change
    host.frame.set({
      fields: [
        { name: 'time', type: 'time', values: [120_000, 180_000] },
        { name: 'cpu', type: 'number', values: [3, 4] },
        { name: 'memory', type: 'number', values: [30, 40] },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.deletedCount).toBe(0);
    expect(host.createdCount).toBe(1);
    // the primitive destroys/recreates purely off reference equality of UplotChart.options()
    // (see optionsUpdateState) - this is the direct mechanism the created/deleted counts above
    // depend on, so it's worth asserting both.
    expect(chart.options()).toBe(optionsBefore);
  });

  it('rebuilds options when a field is added (a genuine structural change)', async () => {
    await TestBed.configureTestingModule({ imports: [RefreshHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(RefreshHostComponent);
    await fixture.whenStable();

    const chart = fixture.debugElement.children[0].componentInstance as UplotChart<DataFrame>;
    const optionsBefore = chart.options();

    fixture.componentInstance.frame.set({
      fields: [
        { name: 'time', type: 'time', values: [120_000, 180_000] },
        { name: 'cpu', type: 'number', values: [3, 4] },
        { name: 'memory', type: 'number', values: [30, 40] },
        { name: 'disk', type: 'number', values: [5, 6] },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(chart.options()).not.toBe(optionsBefore);
    expect(chart.options().series).toHaveLength(4);
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

// A third-party-style series modifier, nested inside the library's own <uplot-series> - proves
// the extension point goes one level deeper than the top-level contributors above.
@Component({
  selector: 'stub-series-modifier',
  providers: [{ provide: UplotSeriesModifier, useExisting: StubSeriesModifier }],
  template: '',
})
class StubSeriesModifier extends UplotSeriesModifier {
  override modify(series: Partial<uPlot.Series>): Partial<uPlot.Series> {
    return { ...series, width: 42 };
  }
}

@Component({
  imports: [UplotChart, UplotSeries, StubSeriesModifier],
  template: `
    <uplot-chart [source]="frame">
      <uplot-series field="cpu"><stub-series-modifier /></uplot-series>
    </uplot-chart>
  `,
})
class SeriesModifierHostComponent {
  readonly frame = testFrame;
}

describe('UplotSeries extensibility', () => {
  it('folds in any UplotSeriesModifier nested inside it, not just UplotConnectNulls', async () => {
    await TestBed.configureTestingModule({ imports: [SeriesModifierHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SeriesModifierHostComponent);
    await fixture.whenStable();

    const chart = fixture.debugElement.children[0].componentInstance as UplotChart<DataFrame>;
    expect(chart.options().series![1]!.width).toBe(42);
  });
});

// A third-party-style series modifier that makes a decision from the adapted frame's *data*,
// not just its own inputs - proves modify()'s adapted parameter actually reaches it.
@Component({
  selector: 'stub-data-aware-series-modifier',
  providers: [{ provide: UplotSeriesModifier, useExisting: StubDataAwareSeriesModifier }],
  template: '',
})
class StubDataAwareSeriesModifier extends UplotSeriesModifier {
  override modify(series: Partial<uPlot.Series>, adapted: AdaptedFrame): Partial<uPlot.Series> {
    const values = (adapted.data[1] ?? []) as (number | null)[];
    const peak = Math.max(...values.filter((v): v is number => v != null));
    return { ...series, label: `peak: ${peak}` };
  }
}

@Component({
  imports: [UplotChart, UplotSeries, StubDataAwareSeriesModifier],
  template: `
    <uplot-chart [source]="frame">
      <uplot-series field="cpu"><stub-data-aware-series-modifier /></uplot-series>
    </uplot-chart>
  `,
})
class DataAwareSeriesModifierHostComponent {
  readonly frame = testFrame;
}

describe('UplotSeriesModifier data access', () => {
  it('receives the adapted frame, not just the series parts', async () => {
    await TestBed.configureTestingModule({ imports: [DataAwareSeriesModifierHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(DataAwareSeriesModifierHostComponent);
    await fixture.whenStable();

    const chart = fixture.debugElement.children[0].componentInstance as UplotChart<DataFrame>;
    // testFrame's cpu field is [1, 2] - peak is 2
    expect(chart.options().series![1]!.label).toBe('peak: 2');
  });
});

// Same proof, one level up: an axis modifier making a decision from the adapted frame.
@Component({
  selector: 'stub-data-aware-axis-modifier',
  providers: [{ provide: UplotAxisModifier, useExisting: StubDataAwareAxisModifier }],
  template: '',
})
class StubDataAwareAxisModifier extends UplotAxisModifier {
  override modify(parts: UplotAxisParts, adapted: AdaptedFrame): UplotAxisParts {
    return { ...parts, axis: { ...parts.axis, label: `fields: ${adapted.fields.length}` } };
  }
}

@Component({
  imports: [UplotChart, UplotAxis, StubDataAwareAxisModifier],
  template: `
    <uplot-chart [source]="frame">
      <uplot-axis scale="y"><stub-data-aware-axis-modifier /></uplot-axis>
    </uplot-chart>
  `,
})
class DataAwareAxisModifierHostComponent {
  readonly frame = testFrame;
}

describe('UplotAxisModifier data access', () => {
  it('receives the adapted frame, not just the axis parts', async () => {
    await TestBed.configureTestingModule({ imports: [DataAwareAxisModifierHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(DataAwareAxisModifierHostComponent);
    await fixture.whenStable();

    const chart = fixture.debugElement.children[0].componentInstance as UplotChart<DataFrame>;
    // testFrame has 2 value fields: cpu, memory
    expect(chart.options().axes?.[1]?.label).toBe('fields: 2');
  });
});
