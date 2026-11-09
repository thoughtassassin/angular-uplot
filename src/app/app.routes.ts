import { Routes } from '@angular/router';
import { GrafanaDemo } from './grafana-demo/grafana-demo';
import { PlainChartDemo } from './plain-chart-demo/plain-chart-demo';

export const routes: Routes = [
  { path: '', component: GrafanaDemo },
  { path: 'plain-chart', component: PlainChartDemo },
];
