import { CaretRightFilled } from '@ant-design/icons';
import { theme, Typography } from 'antd';
import dayjs from 'dayjs';
import { memo } from 'react';

import type { MonthTop } from '../../../../../lib/graphs';

import { seriesColor } from '../artistColors';

interface MonthTopListProps {
  months: MonthTop[];
  onPlay: (month: string, artist: string) => void;
  series: string[];
}

/** Every month's top 10 artists, newest first. Click an artist to play their songs from that month. */
export const MonthTopList = memo(({ months, onPlay, series }: MonthTopListProps) => {
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
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              display: 'grid',
              gap: 12,
              gridTemplateColumns: '110px 1fr',
              padding: '8px 0',
            }}
          >
            <div>
              <Typography.Text strong>{dayjs(`${m.month}-01`).format('MMM YYYY')}</Typography.Text>
              <br />
              <Typography.Text style={{ fontSize: 12 }} type="secondary">
                {m.hours.toFixed(1)}h
              </Typography.Text>
            </div>
            <div style={{ alignContent: 'flex-start', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {m.top.map((a, i) => {
                const color = seriesColor(series, a.artist);
                return (
                  <button
                    key={a.artist}
                    onClick={() => onPlay(m.month, a.artist)}
                    style={{
                      alignItems: 'center',
                      background: token.colorFillQuaternary,
                      border: `1px solid ${color ?? token.colorBorder}`,
                      borderRadius: 999,
                      color: token.colorText,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      fontSize: 12,
                      gap: 6,
                      lineHeight: '18px',
                      padding: '2px 10px 2px 8px',
                    }}
                    title={`Play ${a.artist}'s most-played songs from this month · ${a.hours.toFixed(1)}h, ${a.streams} streams`}
                    type="button"
                  >
                    <span style={{ color: token.colorTextSecondary }}>{i + 1}</span>
                    {a.artist}
                    <span style={{ color: token.colorTextSecondary }}>{a.hours.toFixed(1)}h</span>
                    <CaretRightFilled style={{ color: token.colorTextTertiary, fontSize: 10 }} />
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
