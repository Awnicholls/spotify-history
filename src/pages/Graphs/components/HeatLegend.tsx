import type { JSX } from 'react';

import { Flex, Typography } from 'antd';

import { heatColor } from '../../../lib/color';

/** "Less ▢▢▢▢▢ More" key for the heatmaps. */
export const HeatLegend = ({ accent, empty }: { accent: string; empty: string }): JSX.Element => (
  <Flex align="center" gap={4}>
    <Typography.Text style={{ fontSize: 12, marginRight: 4 }} type="secondary">
      Less
    </Typography.Text>
    {[0, 0.06, 0.25, 0.55, 1].map((v) => (
      <span
        key={v}
        style={{ background: heatColor(accent, v, 1, empty), borderRadius: 2, display: 'inline-block', height: 12, width: 12 }}
      />
    ))}
    <Typography.Text style={{ fontSize: 12, marginLeft: 4 }} type="secondary">
      More
    </Typography.Text>
  </Flex>
);
