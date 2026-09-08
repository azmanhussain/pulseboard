import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetIncidentsQuery, useCreateIncidentMutation } from '../../api/incidentsApi';
import { useGetServicesQuery } from '../../api/servicesApi';
import { useCurrentOrganization } from '../../hooks/useCurrentOrganization';
import StatusBadge from '../../components/StatusBadge';
import SeverityBadge from '../../components/SeverityBadge';
import type { IncidentSeverity } from '../../types';

export const IncidentsListPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const { currentOrgId, currentOrg } = useCurrentOrganization();

  const {
    data: incidents = [],
    isLoading,
    error,
  } = useGetIncidentsQuery(currentOrgId, { skip: !currentOrgId });
  const { data: services = [] } = useGetServicesQuery(currentOrgId, { skip: !currentOrgId });
  const [createIncident, { isLoading: isCreating }] = useCreateIncidentMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('sev2');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredIncidents = incidents.filter((incident) => {
    if (filterStatus === 'ALL') return true;
    return (incident.status || '').toLowerCase() === filterStatus.toLowerCase();
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentOrgId) return;

    try {
      setErrorMessage(null);
      await createIncident({
        organizationId: currentOrgId,
        body: {
          title,
          description: description.trim() || null,
          service_id: serviceId || (services[0]?.id ?? ''),
          severity,
        },
      }).unwrap();

      setTitle('');
      setDescription('');
      setIsModalOpen(false);
    } catch (err: unknown) {
      const errorData = (err as { data?: { detail?: string | { msg?: string }[]; message?: string } })?.data;
      let msg = 'Failed to declare incident.';
      if (typeof errorData?.detail === 'string') {
        msg = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        msg = errorData.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      }
      setErrorMessage(msg);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Incidents</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track, triage, and communicate active service incidents for{' '}
            <span className="text-zinc-200 font-medium">{currentOrg?.name || 'Organization'}</span>
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-lg shadow-sm transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Declare Incident
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800">
        {['ALL', 'triggered', 'acknowledged', 'investigating', 'mitigated', 'resolved'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterStatus.toLowerCase() === tab.toLowerCase()
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            {tab === 'ALL' ? 'All Incidents' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-12 text-center text-zinc-500">Loading incidents...</div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
          Failed to load incidents. Please verify connection and organization permissions.
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <p className="text-zinc-400 text-sm">No incidents matching the selected filter.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/80">
          {filteredIncidents.map((incident) => {
            const affectedService =
              incident.service ||
              services.find((s) => s.id === incident.service_id);

            return (
              <Link
                key={incident.id}
                to={`/incidents/${incident.id}`}
                className="block p-5 hover:bg-zinc-800/40 transition group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-zinc-100 group-hover:text-indigo-400 transition">
                        {incident.title}
                      </h3>
                      <SeverityBadge severity={incident.severity} size="sm" />
                      <StatusBadge status={incident.status} size="sm" />
                    </div>
                    {incident.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{incident.description}</p>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 sm:text-right shrink-0">
                    <p>
                      Service:{' '}
                      <span className="text-zinc-300 font-medium">
                        {affectedService?.name || 'General Service'}
                      </span>
                    </p>
                    <p className="mt-0.5">
                      {incident.created_at
                        ? new Date(incident.created_at).toLocaleDateString()
                        : ''}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Declare Incident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Declare New Incident</h2>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Incident Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elevated error rates on Payment Gateway"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Impacted Service <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a service...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.environment || 'prod'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="sev1">SEV 1 - Critical</option>
                    <option value="sev2">SEV 2 - Major</option>
                    <option value="sev3">SEV 3 - Minor</option>
                    <option value="sev4">SEV 4 - Low</option>
                  </select>
                </div>
              </div>



              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Initial Summary / Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the symptoms, impact, and current investigations..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition cursor-pointer"
                >
                  {isCreating ? 'Declaring...' : 'Declare Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentsListPage;
