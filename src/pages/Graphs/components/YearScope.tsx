import { Button, Flex, Slider, Typography } from 'antd';
import type { YearRange } from '../../../lib/graphs';

interface YearScopeProps {
  bounds: YearRange;
  range: YearRange;
  isAllYears: boolean;
  onChange: (range: YearRange) => void;
  onAllYears: () => void;
}

/** All years / a single year / a range: drag both handles onto one year for a single year. */
export const YearScope = ({ bounds, range, isAllYears, onChange, onAllYears }: YearScopeProps) => {
  const [min, max] = bounds;
  const label = isAllYears ? 'All years' : range[0] === range[1] ? String(range[0]) : `${range[0]} – ${range[1]}`;
  const marks = Object.fromEntries(
    Array.from({ length: max - min + 1 }, (_, i) => min + i).map((y) => [y, String(y).slice(2)]),
  );

  return (
    <Flex align="center" gap={16} style={{ minWidth: 0, flex: '0 1 560px' }}>
      <Typography.Text strong style={{ whiteSpace: 'nowrap', minWidth: 90, textAlign: 'right' }}>
        {label}
      </Typography.Text>
      {min < max && (
        <Slider
          range
          min={min}
          max={max}
          step={1}
          marks={marks}
          value={range}
          onChange={(v) => onChange([v[0], v[1]] as YearRange)}
          tooltip={{ formatter: (v) => v }}
          style={{ flex: 1, minWidth: 200 }}
        />
      )}
      <Button size="small" onClick={onAllYears} disabled={isAllYears}>
        All years
      </Button>
    </Flex>
  );
};
