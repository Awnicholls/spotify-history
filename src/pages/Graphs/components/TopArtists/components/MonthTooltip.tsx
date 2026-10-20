import type { JSX } from 'react';

import { theme } from 'antd';

import type { MonthTop } from '../../../../../lib/graphs';

import { seriesColor } from '../artistColors';

interface MonthTooltipProps {
  /** Injected by Recharts. */
  active?: boolean;
  formatLabel: (monthKey: string) => string;
  /** Injected by Recharts: the hovered month key ('YYYY-MM'). */
  label?: number | string;
  monthsByKey: Record<string, MonthTop>;
  series: string[];
}

/** Chart hover card: that month's own top 10 artists with hours and share. */
export const MonthTooltip = ({ active, formatLabel, label, monthsByKey, series }: MonthTooltipProps): JSX.Element | null => {
  const { token } = theme.useToken();
  const month = active && label !== undefined ? monthsByKey[String(label)] : undefined;
  if (!month) {return null;}

  return (
    <div
      style={{
        background: token.colorBgElevated,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        boxShadow: token.boxShadowSecondary,
        color: token.colorText,
        fontSize: 12,
        minWidth: 240,
        padding: '8px 12px',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {formatLabel(month.month)} · {month.hours.toFixed(1)}h
      </div>
      {month.top.length === 0 ? (
        <div style={{ color: token.colorTextSecondary }}>Nothing played</div>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {month.top.map((a, i) => (
            <li key={a.artist} style={{ alignItems: 'center', display: 'flex', gap: 8, padding: '1px 0' }}>
              <span style={{ color: token.colorTextSecondary, textAlign: 'right', width: 16 }}>{i + 1}</span>
              <span
                style={{
                  background: seriesColor(series, a.artist) ?? 'transparent',
                  border: seriesColor(series, a.artist) ? 'none' : `1px solid ${token.colorBorder}`,
                  borderRadius: 2,
                  flexShrink: 0,
                  height: 8,
                  width: 8,
                }}
              />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.artist}
              </span>
              <span style={{ color: token.colorTextSecondary }}>
                {a.hours.toFixed(1)}h · {month.hours ? Math.round((a.hours / month.hours) * 100) : 0}%
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
