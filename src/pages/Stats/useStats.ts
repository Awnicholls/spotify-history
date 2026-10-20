import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import type { PlayFilters, StatCategory, StatRow } from '../../lib/aggregate';
import { aggregate, DEFAULT_FILTERS, deviceTreeOf, filterPlays, summarize, yearsOf } from '../../lib/aggregate';
import type { StoredHistory } from '../../types/history';
import type { StatsViewProps } from './Stats.view';

export interface StatsTab {
  key: StatCategory;
  label: string;
  rows: StatRow[];
}

/** 'all' | 'last30' | 'last365' | 'custom' | 'y:<year>' */
export type DatePeriod = string;

export interface PeriodOption {
  label: string;
  value: DatePeriod;
}

const TAB_LABELS: Record<StatCategory, string> = {
  songs: 'Songs',
  artists: 'Artists',
  albums: 'Albums',
  shows: 'Podcasts',
  episodes: 'Episodes',
  audiobooks: 'Audiobooks',
  platforms: 'Devices',
};

/** Music tabs always show; podcast/audiobook tabs only when the history has any. */
const ALWAYS_SHOWN: StatCategory[] = ['songs', 'artists', 'albums', 'platforms'];

/** Resolve the selected period to an inclusive epoch-ms range (null = all time). */
const periodRange = (period: DatePeriod, custom: [Dayjs, Dayjs] | null): [number, number] | null => {
  const now = dayjs();
  if (period === 'last30') return [now.subtract(30, 'day').startOf('day').valueOf(), now.endOf('day').valueOf()];
  if (period === 'last365') return [now.subtract(12, 'month').startOf('day').valueOf(), now.endOf('day').valueOf()];
  if (period.startsWith('y:')) {
    const year = dayjs(new Date(Number(period.slice(2)), 0, 1));
    return [year.startOf('year').valueOf(), year.endOf('year').valueOf()];
  }
  if (period === 'custom' && custom) return [custom[0].startOf('day').valueOf(), custom[1].endOf('day').valueOf()];
  return null;
};

export const useStats = ({ history }: { history: StoredHistory }): StatsViewProps => {
  const allPlays = history.plays;
  const [period, setPeriod] = useState<DatePeriod>('all');
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [devices, setDevices] = useState<string[]>(DEFAULT_FILTERS.devices);
  const [minPlaySeconds, setMinPlaySeconds] = useState(DEFAULT_FILTERS.minPlaySeconds);
  const [includeIncognito, setIncludeIncognito] = useState(DEFAULT_FILTERS.includeIncognito);
  const [activeTab, setActiveTab] = useState<StatCategory>('songs');

  const deviceTree = useMemo(() => deviceTreeOf(allPlays), [allPlays]);

  const periodOptions = useMemo<PeriodOption[]>(
    () => [
      { label: 'All time', value: 'all' },
      { label: 'Last 30 days', value: 'last30' },
      { label: 'Last 12 months', value: 'last365' },
      ...yearsOf(allPlays).map((y) => ({ label: String(y), value: `y:${y}` })),
      { label: 'Custom range…', value: 'custom' },
    ],
    [allPlays],
  );

  const filters = useMemo<PlayFilters>(
    () => ({ range: periodRange(period, customRange), devices, minPlaySeconds, includeIncognito }),
    [period, customRange, devices, minPlaySeconds, includeIncognito],
  );

  const plays = useMemo(() => filterPlays(allPlays, filters), [allPlays, filters]);
  const minPlayMs = minPlaySeconds * 1000;

  const summary = useMemo(() => summarize(plays, minPlayMs), [plays, minPlayMs]);

  const tabs = useMemo<StatsTab[]>(() => {
    const kinds = new Set(allPlays.map((p) => p.kind));
    const categories = (Object.keys(TAB_LABELS) as StatCategory[]).filter(
      (c) =>
        ALWAYS_SHOWN.includes(c) ||
        ((c === 'shows' || c === 'episodes') && kinds.has('episode')) ||
        (c === 'audiobooks' && kinds.has('audiobook')),
    );
    return categories.map((key) => ({
      key,
      label: TAB_LABELS[key],
      rows: aggregate(plays, key, minPlayMs),
    }));
  }, [allPlays, plays, minPlayMs]);

  const resetFilters = () => {
    setPeriod('all');
    setCustomRange(null);
    setDevices(DEFAULT_FILTERS.devices);
    setMinPlaySeconds(DEFAULT_FILTERS.minPlaySeconds);
    setIncludeIncognito(DEFAULT_FILTERS.includeIncognito);
  };

  return {
    filterBar: {
      period,
      periodOptions,
      customRange,
      devices,
      deviceTree,
      minPlaySeconds,
      includeIncognito,
      onPeriodChange: setPeriod,
      onCustomRangeChange: setCustomRange,
      onDevicesChange: setDevices,
      onMinPlaySecondsChange: (v) => setMinPlaySeconds(Math.max(0, v ?? 0)),
      onIncludeIncognitoChange: setIncludeIncognito,
      onReset: resetFilters,
    },
    legacyDevices: !!history.legacyDevices,
    summary,
    minPlaySeconds,
    tabs,
    activeTab,
    onTabChange: (key) => setActiveTab(key as StatCategory),
  };
};
