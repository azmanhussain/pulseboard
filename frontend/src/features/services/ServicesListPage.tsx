import React, { useState } from 'react';
import { useGetServicesQuery, useCreateServiceMutation, useDeleteServiceMutation } from '../../api/servicesApi';
import { useCurrentOrganization } from '../../hooks/useCurrentOrganization';
import ServiceCard from './ServiceCard';
import type { Service } from '../../types';

export const ServicesListPage: React.FC = () => {
  const { currentOrgId, currentOrg } = useCurrentOrganization();
  const {
    data: services = [],
    isLoading,
    error,
  } = useGetServicesQuery(currentOrgId, { skip: !currentOrgId });
  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [interval, setInterval] = useState(60);
  const [timeoutMs, setTimeoutMs] = useState(5000);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !currentOrgId) return;
    try {
      setErrorMessage(null);
      await createService({
        organizationId: currentOrgId,
        body: {
          name,
          url,
          environment,
          health_check_interval: Number(interval),
          timeout_ms: Number(timeoutMs),
        },
      }).unwrap();
      setName('');
      setUrl('');
      setEnvironment('production');
      setInterval(60);
      setTimeoutMs(5000);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const errorData = (err as { data?: { detail?: string | { msg?: string }[]; message?: string } })?.data;
      let msg = 'Failed to create service.';
      if (typeof errorData?.detail === 'string') {
        msg = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        msg = errorData.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      }
      setErrorMessage(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentOrgId) return;
    if (confirm('Are you sure you want to delete this service?')) {
      await deleteService({ organizationId: currentOrgId, serviceId: id });
    }
  };

  const operationalCount = services.filter((s) => s.current_status === 'healthy').length;
  const degradedCount = services.filter((s) => s.current_status === 'degraded').length;
  const outageCount = services.filter((s) => s.current_status === 'down').length;

  if (!currentOrgId) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-2">Organization Required</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Please create an organization or select an active organization in the sidebar to start monitoring services.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Monitored Services
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time health status and automated uptime checks for{' '}
            <span className="text-zinc-200 font-medium">{currentOrg?.name || 'Organization'}</span>
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-sm transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Service
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Healthy / Operational</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{operationalCount}</span>
            <span className="text-xs text-zinc-500">/ {services.length} services</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Degraded</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{degradedCount}</span>
            <span className="text-xs text-zinc-500">services impacted</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Down / Outages</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">{outageCount}</span>
            <span className="text-xs text-zinc-500">active disruptions</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 text-center text-zinc-500">Loading monitored services...</div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
          Failed to load services for this organization.
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <p className="text-zinc-400 text-sm">No services added yet for {currentOrg?.name}.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-3 text-sm text-indigo-400 hover:underline cursor-pointer"
          >
            Add your first service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service: Service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Add New Service</h2>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Service Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Payment API"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Health Check URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://api.example.com/health"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-zinc-500 mt-1">URL pinged by automated background health checkers</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Interval (sec)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={3600}
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    min={500}
                    max={30000}
                    value={timeoutMs}
                    onChange={(e) => setTimeoutMs(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition cursor-pointer"
                >
                  {isCreating ? 'Creating Service...' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesListPage;
