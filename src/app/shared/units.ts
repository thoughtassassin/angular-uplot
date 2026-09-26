export type Unit = 'none' | 'percent' | 'bytes' | 'short';

function formatBytes(v: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let n = v;
  let i = 0;
  while (Math.abs(n) >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}

function formatShort(v: number): string {
  const units = ['', 'K', 'M', 'B'];
  let n = v;
  let i = 0;
  while (Math.abs(n) >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return `${n.toFixed(n % 1 === 0 ? 0 : 1)}${units[i]}`;
}

export const unitFormatters: Record<Unit, (v: number) => string> = {
  none: (v) => v.toString(),
  percent: (v) => `${v.toFixed(1)}%`,
  bytes: formatBytes,
  short: formatShort,
};
