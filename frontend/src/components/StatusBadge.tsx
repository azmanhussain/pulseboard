import React from 'react';
import type { ServiceStatus, IncidentStatus } from '../types';

type AnyStatus = ServiceStatus | IncidentStatus | string;

interface StatusBadgeProps {
  status: AnyStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  // Service statuses
  HEALTHY: {
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Healthy',
  },
  OPERATIONAL: {
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Operational',
  },
  DEGRADED: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    label: 'Degraded',
  },
  DOWN: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    text: 'text-rose-400',
    dot: 'bg-rose-400 animate-pulse',
    label: 'Down',
  },
  OUTAGE: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    text: 'text-rose-400',
    dot: 'bg-rose-400 animate-pulse',
    label: 'Major Outage',
  },
  UNKNOWN: {
    bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    text: 'text-zinc-400',
    dot: 'bg-zinc-400',
    label: 'Unknown',
  },
  MAINTENANCE: {
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    label: 'Maintenance',
  },

  // Incident statuses
  TRIGGERED: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    text: 'text-rose-400',
    dot: 'bg-rose-400 animate-pulse',
    label: 'Triggered',
  },
  ACKNOWLEDGED: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    label: 'Acknowledged',
  },
  INVESTIGATING: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    label: 'Investigating',
  },
  MITIGATED: {
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    text: 'text-sky-400',
    dot: 'bg-sky-400',
    label: 'Mitigated',
  },
  IDENTIFIED: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    label: 'Identified',
  },
  MONITORING: {
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    text: 'text-sky-400',
    dot: 'bg-sky-400',
    label: 'Monitoring',
  },
  RESOLVED: {
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Resolved',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = (status || '').toUpperCase();
  const config = statusConfig[normalized] || {
    bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    text: 'text-zinc-400',
    dot: 'bg-zinc-400',
    label: status || 'Unknown',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
