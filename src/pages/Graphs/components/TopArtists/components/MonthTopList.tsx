import { CaretRightFilled } from '@ant-design/icons';
import { Typography, theme } from 'antd';
import dayjs from 'dayjs';
import { memo } from 'react';
import type { MonthTop } from '../../../../../lib/graphs';
import { seriesColor } from '../artistColors';

interface MonthTopListProps {
  months: MonthTop[];
  series: string[];
  onPlay: (month: string, artist: string) => void;
}

/** Every month's top 10 artists, newest first. Click an artist to play their songs from that month. */
export const MonthTopList = memo(({ months, series, onPlay }: MonthTopListProps) => {
  const { token } = theme.useToken();

  return (
    <div>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Top 10 each month
      </Typography.Title>
      <div style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
        {months.map((m) => (
          <div
            key={m.month}
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr',
              gap: 12,
              padding: '8px 0',
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <div>
              <Typography.Text strong>{dayjs(`${m.month}-01`).format('MMM YYYY')}</Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {m.hours.toFixed(1)}h
              </Typography.Text>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start' }}>
              {m.top.map((a, i) => {
                const color = seriesColor(series, a.artist);
                return (
                  <button
                    key={a.artist}
                    type="button"
                    title={`Play ${a.artist}'s most-played songs from this month · ${a.hours.toFixed(1)}h, ${a.streams} streams`}
                    onClick={() => onPlay(m.month, a.artist)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      border: `1px solid ${color ?? token.colorBorder}`,
                      borderRadius: 999,
                      padding: '2px 10px 2px 8px',
                      background: token.colorFillQuaternary,
                      color: token.colorText,
                      fontSize: 12,
                      lineHeight: '18px',
                    }}
                  >
                    <span style={{ color: token.colorTextSecondary }}>{i + 1}</span>
                    {a.artist}
                    <span style={{ color: token.colorTextSecondary }}>{a.hours.toFixed(1)}h</span>
                    <CaretRightFilled style={{ fontSize: 10, color: token.colorTextTertiary }} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
MonthTopList.displayName = 'MonthTopList';
