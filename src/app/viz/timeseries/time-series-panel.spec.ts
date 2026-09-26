import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSeriesPanel } from './time-series-panel';
import { DataFrame } from '../../data/data-frame';

const testFrame: DataFrame = {
  fields: [
    { name: 'Time', type: 'time', values: [0, 60_000, 120_000] },
    { name: 'value', type: 'number', values: [1, 2, 3] },
  ],
};

describe('TimeSeriesPanel', () => {
  let component: TimeSeriesPanel;
  let fixture: ComponentFixture<TimeSeriesPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSeriesPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeSeriesPanel);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('frame', testFrame);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
