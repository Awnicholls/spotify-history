import { Flex, Typography } from 'antd';
import { heatColor } from '../../../lib/color';

/** "Less ▢▢▢▢▢ More" key for the heatmaps. */
export const HeatLegend = ({ accent, empty }: { accent: string; empty: string }) => (
  <Flex align="center" gap={4}>
    <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: 4 }}>
      Less
    </Typography.Text>
    {[0, 0.06, 0.25, 0.55, 1].map((v) => (
      <span
        key={v}
        style={{ width: 12, height: 12, borderRadius: 2, background: heatColor(accent, v, 1, empty), display: 'inline-block' }}
      />
    ))}
    <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
      More
    </Typography.Text>
  </Flex>
);
