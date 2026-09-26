import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Panel } from './panel';
import { TimeSeriesFrame } from '../uplot/time-series-frame';

const testFrame: TimeSeriesFrame = {
  fields: [
    { name: 'Time', type: 'time' },
    { name: 'value', type: 'number' },
  ],
  values: [
    [0, 60_000, 120_000],
    [1, 2, 3],
  ],
};

describe('Panel', () => {
  let component: Panel;
  let fixture: ComponentFixture<Panel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Panel],
    }).compileComponents();

    fixture = TestBed.createComponent(Panel);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('frame', testFrame);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
