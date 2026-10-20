import type { JSX } from 'react';

import { Flex, Tooltip, Typography } from 'antd';

import { HEAT_STEPS, heatLevelColor } from '../../../lib/color';

interface HeatLegendProps {
  accent: string;
  empty: string;
  /** Formats a breakpoint for the swatch tooltips. */
  format: (value: number) => string;
  /** Quantile breakpoints from heatThresholds. */
  thresholds: readonly number[];
}

const LEVELS = Array.from({ length: HEAT_STEPS + 1 }, (_, level) => level);

/** "Less ▢▢▢▢▢ More" key for the heatmaps; hover a swatch for the range it covers. */
export const HeatLegend = ({ accent, empty, format, thresholds }: HeatLegendProps): JSX.Element => {
  const rangeOf = (level: number): string => {
    if (level === 0) {return 'Nothing';}
    const from = level === 1 ? undefined : thresholds[level - 2];
    const to = thresholds[level - 1];
    if (from === undefined && to !== undefined) {return `Under ${format(to)}`;}
    if (from !== undefined && to === undefined) {return `${format(from)} or more`;}
    if (from !== undefined && to !== undefined) {return `${format(from)} – ${format(to)}`;}
    return 'Some';
  };

  return (
    <Flex align="center" gap={4}>
      <Typography.Text style={{ fontSize: 12, marginRight: 4 }} type="secondary">
        Less
      </Typography.Text>
      {LEVELS.map((level) => (
        <Tooltip key={level} title={rangeOf(level)}>
          <span
            style={{
              background: heatLevelColor(level, accent, empty),
              borderRadius: 2,
              display: 'inline-block',
              height: 12,
              width: 12,
            }}
          />
        </Tooltip>
      ))}
      <Typography.Text style={{ fontSize: 12, marginLeft: 4 }} type="secondary">
        More
      </Typography.Text>
    </Flex>
  );
};
