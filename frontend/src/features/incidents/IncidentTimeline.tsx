import React from 'react';
import type { IncidentEvent } from '../../types';
import StatusBadge from '../../components/StatusBadge';

interface IncidentTimelineProps {
  events?: IncidentEvent[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  events = [],
}) => {
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getEventTitle = (event: IncidentEvent) => {
    const actor = event.actor_id ? 'Engineer' : 'System';
    switch (event.event_type) {
      case 'created':
        return `${actor} declared the incident`;
      case 'status_changed': {
        const from = event.event_metadata?.from as string;
        const to = event.event_metadata?.to as string;
        return `${actor} transitioned status ${from ? `from ${from} ` : ''}to ${to || 'new state'}`;
      }
      case 'assigned':
      case 'reassigned':
        return `${actor} updated assignee`;
      case 'severity_changed':
        return `${actor} updated incident severity`;
      case 'comment_added':
        return `${actor} added a comment`;
      case 'resolved':
        return `${actor} marked incident as resolved`;
      default:
        return `${actor} triggered ${event.event_type}`;
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-white">Event Timeline</h3>
        <span className="text-xs text-zinc-500">{sortedEvents.length} events logged</span>
      </div>

      {sortedEvents.length === 0 ? (
        <p className="text-xs text-zinc-500 italic py-4">No events recorded yet.</p>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
          {sortedEvents.map((item) => {
            const isSystem = !item.actor_id;

            return (
              <div key={item.id} className="relative">
                <span
                  className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-zinc-950 border-2 ${
                    isSystem ? 'border-amber-500' : 'border-indigo-500'
                  }`}
                />
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${
                      isSystem
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    }`}
                  >
                    {isSystem ? 'System' : 'Actor'}
                  </span>
                  <span className="text-xs font-medium text-zinc-200">{getEventTitle(item)}</span>
                  <span className="text-xs text-zinc-500 ml-auto">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                {item.event_metadata && (
                  <div className="mt-1.5 p-2 bg-zinc-950/60 rounded border border-zinc-800/80 text-xs text-zinc-400">
                    {Boolean(item.event_metadata.to) && (
                      <div className="flex items-center gap-2">
                        <span>New status:</span>
                        <StatusBadge status={String(item.event_metadata.to)} size="sm" />
                      </div>
                    )}
                    {Object.entries(item.event_metadata)
                      .filter(([key]) => key !== 'to' && key !== 'from')
                      .map(([key, val]) => (
                        <div key={key} className="text-[11px] text-zinc-400 truncate">
                          <span className="text-zinc-500">{key}:</span> {String(val)}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IncidentTimeline;
