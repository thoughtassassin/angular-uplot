import { DataFrame } from 'angular-uplot';

// stands in for whatever your backend/datasource adapter returns - DataFrame is the library's default adapter input shape
export function makeFrame(): DataFrame {
  const now = Date.now();
  const time: number[] = [];
  const cpu: (number | null)[] = [];
  const mem: (number | null)[] = [];

  for (let i = 0; i < 200; i++) {
    time.push(now - (200 - i) * 60_000);

    // punch a few gaps in each series so "connect null values" has something to show
    const cpuGap = i >= 60 && i < 75;
    const memGap = i >= 120 && i < 130;
    cpu.push(cpuGap ? null : Math.sin(i / 10) * 20 + 40 + Math.random() * 8);
    mem.push(memGap ? null : Math.cos(i / 14) * 15 + 60 + Math.random() * 6);
  }

  return {
    fields: [
      { name: 'Time', type: 'time', values: time },
      // this field always bridges its own gaps regardless of the panel's connect-nulls setting
      {
        name: 'cpu',
        type: 'number',
        config: { label: 'CPU', color: '#73bf69', custom: { connectNulls: true } },
        values: cpu,
      },
      { name: 'mem', type: 'number', config: { label: 'Memory', color: '#5794f2' }, values: mem },
    ],
  };
}
