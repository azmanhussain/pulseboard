import React from 'react';
import type { IncidentSeverity } from '../types';

interface SeverityBadgeProps {
  severity: IncidentSeverity | string;
  size?: 'sm' | 'md';
}

const severityConfig: Record<string, { bg: string; text: string; label: string }> = {
  SEV1: {
    bg: 'bg-red-500/15 text-red-400 border-red-500/30',
    text: 'text-red-400',
    label: 'SEV 1 - Critical',
  },
  CRITICAL: {
    bg: 'bg-red-500/15 text-red-400 border-red-500/30',
    text: 'text-red-400',
    label: 'Critical',
  },
  SEV2: {
    bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    text: 'text-orange-400',
    label: 'SEV 2 - Major',
  },
  MAJOR: {
    bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    text: 'text-orange-400',
    label: 'Major',
  },
  SEV3: {
    bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    text: 'text-amber-400',
    label: 'SEV 3 - Minor',
  },
  MINOR: {
    bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    text: 'text-amber-400',
    label: 'Minor',
  },
  SEV4: {
    bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    text: 'text-blue-400',
    label: 'SEV 4 - Low',
  },
  LOW: {
    bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    text: 'text-blue-400',
    label: 'Low',
  },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const normalized = (severity || '').toUpperCase();
  const config = severityConfig[normalized] || {
    bg: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    text: 'text-zinc-400',
    label: severity || 'Unknown',
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border tracking-wider uppercase ${config.bg} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
};

export default SeverityBadge;
