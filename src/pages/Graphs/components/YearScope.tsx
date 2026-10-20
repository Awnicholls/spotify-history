import type { JSX } from 'react';

import { Button, Flex, Slider, Typography } from 'antd';

import type { YearRange } from '../../../lib/graphs';

interface YearScopeProps {
  bounds: YearRange;
  isAllYears: boolean;
  onAllYears: () => void;
  onChange: (range: YearRange) => void;
  range: YearRange;
}

/** All years / a single year / a range: drag both handles onto one year for a single year. */
export const YearScope = ({ bounds, isAllYears, onAllYears, onChange, range }: YearScopeProps): JSX.Element => {
  const [min, max] = bounds;
  const label = isAllYears ? 'All years' : range[0] === range[1] ? String(range[0]) : `${range[0]} – ${range[1]}`;
  const marks = Object.fromEntries(
    Array.from({ length: max - min + 1 }, (_, i) => min + i).map((y) => [y, String(y).slice(2)]),
  );

  return (
    <Flex align="center" gap={16} style={{ flex: '0 1 560px', minWidth: 0 }}>
      <Typography.Text strong style={{ minWidth: 90, textAlign: 'right', whiteSpace: 'nowrap' }}>
        {label}
      </Typography.Text>
      {min < max && (
        <Slider
          marks={marks}
          max={max}
          min={min}
          onChange={(v) => onChange([v[0], v[1]] as YearRange)}
          range
          step={1}
          style={{ flex: 1, minWidth: 200 }}
          tooltip={{ formatter: (v) => v }}
          value={range}
        />
      )}
      <Button disabled={isAllYears} onClick={onAllYears} size="small">
        All years
      </Button>
    </Flex>
  );
};
