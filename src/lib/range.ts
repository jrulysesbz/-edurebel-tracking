// src/lib/range.ts

export type RangeKey = '7d' | '30d' | '90d' | '12m';

export type RangeInfo = {
  key: RangeKey;
  fromIso: string | null;
  label: string;
};

/**
 * Normalize the range query into:
 * - key: one of '7d' | '30d' | '90d' | '12m'
 * - fromIso: ISO timestamp for the start of that window
 * - label: human-readable for UI / reports
 */
export function getRangeInfo(raw: string | string[] | undefined | null): RangeInfo {
  let value: string | undefined;

  if (Array.isArray(raw)) {
    value = raw[0];
  } else {
    value = raw ?? undefined;
  }

  let key: RangeKey = '30d';
  if (value === '7d' || value === '30d' || value === '90d' || value === '12m') {
    key = value;
  }

  const now = new Date();
  const from = new Date(now);
  let label = '';

  switch (key) {
    case '7d': {
      from.setDate(from.getDate() - 7);
      label = 'Last 7 days';
      break;
    }
    case '30d': {
      from.setDate(from.getDate() - 30);
      label = 'Last 30 days';
      break;
    }
    case '90d': {
      from.setDate(from.getDate() - 90);
      label = 'Last 90 days';
      break;
    }
    case '12m': {
      from.setFullYear(from.getFullYear() - 1);
      label = 'Last 12 months';
      break;
    }
  }

  const fromIso = from.toISOString();

  return {
    key,
    fromIso,
    label,
  };
}
