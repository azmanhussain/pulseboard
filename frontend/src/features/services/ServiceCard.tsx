import React from 'react';
import type { Service } from '../../types';
import StatusBadge from '../../components/StatusBadge';

interface ServiceCardProps {
  service: Service;
  onEdit?: (service: Service) => void;
  onDelete?: (id: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
}) => {
  const status = service.current_status || service.status || 'unknown';
  const interval = service.health_check_interval ?? 60;
  const timeout = service.timeout_ms ?? 5000;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-100">{service.name}</h3>
              {service.environment && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {service.environment}
                </span>
              )}
            </div>
            {service.url && (
              <p className="text-xs font-mono text-zinc-400 mt-1 truncate max-w-xs" title={service.url}>
                {service.url}
              </p>
            )}
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/60">
          <div>
            <span className="text-xs text-zinc-500 block mb-0.5">Check Interval</span>
            <span className="text-sm font-semibold text-zinc-300">{interval}s</span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 block mb-0.5">Timeout</span>
            <span className="text-sm font-semibold text-zinc-300">{timeout} ms</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs text-zinc-500">
        <span className="font-mono text-xs">
          Timeout: {timeout}ms
        </span>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(service)}
              className="text-zinc-400 hover:text-indigo-400 transition cursor-pointer"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(service.id)}
              className="text-zinc-400 hover:text-rose-400 transition cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
