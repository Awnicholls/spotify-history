import { theme } from 'antd';
import type { MonthTop } from '../../../../../lib/graphs';
import { seriesColor } from '../artistColors';

/** Chart hover card: that month's own top 10 artists with hours and share. */
export const MonthTooltip = ({ month, series, label }: { month?: MonthTop; series: string[]; label: string }) => {
  const { token } = theme.useToken();
  if (!month) return null;

  return (
    <div
      style={{
        background: token.colorBgElevated,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        boxShadow: token.boxShadowSecondary,
        padding: '8px 12px',
        minWidth: 240,
        fontSize: 12,
        color: token.colorText,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {label} · {month.hours.toFixed(1)}h
      </div>
      {month.top.length === 0 ? (
        <div style={{ color: token.colorTextSecondary }}>Nothing played</div>
      ) : (
        <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {month.top.map((a, i) => (
            <li key={a.artist} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '1px 0' }}>
              <span style={{ width: 16, textAlign: 'right', color: token.colorTextSecondary }}>{i + 1}</span>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: seriesColor(series, a.artist) ?? 'transparent',
                  border: seriesColor(series, a.artist) ? 'none' : `1px solid ${token.colorBorder}`,
                  flexShrink: 0,
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
