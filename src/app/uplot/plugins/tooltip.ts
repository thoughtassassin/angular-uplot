import uPlot from 'uplot';

export interface TooltipOptions {
  /** Formats the x-value shown in the tooltip header. Defaults to a locale time string, treating x as unix seconds. */
  formatTime?: (xValue: number) => string;
  /** Formats a single series value. Defaults to 2 decimal places. */
  formatValue?: (value: number, seriesIdx: number) => string;
}

const defaultFormatTime = (xValue: number): string => new Date(xValue * 1000).toLocaleString();
const defaultFormatValue = (value: number): string => value.toFixed(2);

export function tooltipPlugin(opts: TooltipOptions = {}): uPlot.Plugin {
  const formatTime = opts.formatTime ?? defaultFormatTime;
  const formatValue = opts.formatValue ?? defaultFormatValue;

  let tooltip: HTMLDivElement;
  let timeEl: HTMLDivElement;
  let rowsEl: HTMLDivElement;
  let rows: { root: HTMLDivElement; marker: HTMLSpanElement; label: HTMLSpanElement; value: HTMLSpanElement }[] = [];
  let lastIdx: number | null | undefined;

  function buildRows(u: uPlot): void {
    rowsEl.innerHTML = '';
    rows = u.series.slice(1).map(() => {
      const root = document.createElement('div');
      root.className = 'u-tooltip-row';

      const marker = document.createElement('span');
      marker.className = 'u-tooltip-marker';

      const label = document.createElement('span');
      label.className = 'u-tooltip-label';

      const value = document.createElement('span');
      value.className = 'u-tooltip-value';

      root.append(marker, label, value);
      rowsEl.append(root);

      return { root, marker, label, value };
    });
  }

  return {
    hooks: {
      init: (u) => {
        tooltip = document.createElement('div');
        tooltip.className = 'u-tooltip';
        tooltip.style.display = 'none';

        timeEl = document.createElement('div');
        timeEl.className = 'u-tooltip-time';

        rowsEl = document.createElement('div');
        rowsEl.className = 'u-tooltip-rows';

        tooltip.append(timeEl, rowsEl);
        u.over.appendChild(tooltip);

        buildRows(u);
      },

      setCursor: (u) => {
        const { idx, left, top } = u.cursor;

        if (idx == null || left == null || top == null || left < 0) {
          tooltip.style.display = 'none';
          lastIdx = idx;
          return;
        }

        if (idx !== lastIdx) {
          timeEl.textContent = formatTime(u.data[0][idx] as number);

          // find the series whose value is pixel-closest to the cursor's y position,
          // so we can bold it the way Grafana highlights the hovered series
          let closestSeriesIdx = -1;
          let closestDist = Infinity;

          u.series.forEach((s, i) => {
            if (i === 0 || s.show === false) return;
            const val = u.data[i][idx] as number | null;
            if (val == null) return;
            const dist = Math.abs(u.valToPos(val, s.scale ?? 'y', false) - top);
            if (dist < closestDist) {
              closestDist = dist;
              closestSeriesIdx = i;
            }
          });

          u.series.forEach((s, i) => {
            if (i === 0) return;
            const row = rows[i - 1];
            if (!row) return;

            if (s.show === false) {
              row.root.style.display = 'none';
              return;
            }

            const value = u.data[i][idx] as number | null;
            const stroke = typeof s.stroke === 'function' ? s.stroke(u, i) : s.stroke;

            row.root.style.display = 'flex';
            row.root.classList.toggle('is-active', i === closestSeriesIdx);
            row.marker.style.background = (stroke as string) ?? '';
            row.label.textContent = (s.label as string) ?? `Series ${i}`;
            row.value.textContent = value == null ? '—' : formatValue(value, i);
          });

          lastIdx = idx;
        }

        tooltip.style.display = 'block';

        const overWidth = u.over.clientWidth;
        const overHeight = u.over.clientHeight;
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        const offset = 12;

        let x = left + offset;
        let y = top + offset;

        if (x + tooltipWidth > overWidth) x = left - tooltipWidth - offset;
        if (y + tooltipHeight > overHeight) y = top - tooltipHeight - offset;

        tooltip.style.transform = `translate(${Math.max(0, x)}px, ${Math.max(0, y)}px)`;
      },

      destroy: () => {
        tooltip?.remove();
      },
    },
  };
}
