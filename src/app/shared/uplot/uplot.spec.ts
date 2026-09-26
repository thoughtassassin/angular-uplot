import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Uplot } from './uplot';

describe('Uplot', () => {
  let component: Uplot;
  let fixture: ComponentFixture<Uplot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Uplot],
    }).compileComponents();

    fixture = TestBed.createComponent(Uplot);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', { width: 400, height: 200, series: [{}, {}] });
    fixture.componentRef.setInput('data', [[0, 1, 2], [0, 1, 2]]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
