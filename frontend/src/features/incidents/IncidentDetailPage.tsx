import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useGetIncidentByIdQuery,
  useUpdateIncidentStatusMutation,
  useAssignIncidentMutation,
} from '../../api/incidentsApi';
import { useGetOrganizationMembersQuery } from '../../api/organizationsApi';
import { useCurrentOrganization } from '../../hooks/useCurrentOrganization';
import StatusBadge from '../../components/StatusBadge';
import SeverityBadge from '../../components/SeverityBadge';
import IncidentTimeline from './IncidentTimeline';
import CommentThread from './CommentThread';
import type { IncidentStatus } from '../../types';

// State machine allowed transitions
const VALID_TRANSITIONS: Record<string, IncidentStatus[]> = {
  triggered: ['acknowledged'],
  acknowledged: ['investigating'],
  investigating: ['mitigated', 'resolved'],
  mitigated: ['resolved'],
  resolved: [],
};

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentOrgId } = useCurrentOrganization();

  const {
    data: incident,
    isLoading,
    error,
  } = useGetIncidentByIdQuery(
    { organizationId: currentOrgId, incidentId: id || '' },
    { skip: !currentOrgId || !id }
  );

  const { data: members = [] } = useGetOrganizationMembersQuery(currentOrgId, {
    skip: !currentOrgId,
  });

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateIncidentStatusMutation();
  const [assignIncident, { isLoading: isAssigning }] = useAssignIncidentMutation();
  const [transitionError, setTransitionError] = useState<string | null>(null);

  if (isLoading) {
    return <div className="py-12 text-center text-zinc-500">Loading incident details...</div>;
  }

  if (error || !incident) {
    return (
      <div className="space-y-4">
        <Link to="/incidents" className="text-sm text-indigo-400 hover:underline">
          &larr; Back to Incidents
        </Link>
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
          Incident not found or failed to load for this organization.
        </div>
      </div>
    );
  }

  const currentStatus = (incident.status || 'triggered').toLowerCase();
  const availableTransitions = VALID_TRANSITIONS[currentStatus] || [];

  const handleStatusChange = async (nextStatus: IncidentStatus) => {
    if (!id || !currentOrgId) return;
    try {
      setTransitionError(null);
      await updateStatus({
        organizationId: currentOrgId,
        incidentId: id,
        status: nextStatus,
      }).unwrap();
    } catch (err: unknown) {
      const errorData = (err as { data?: { detail?: string } })?.data;
      setTransitionError(errorData?.detail || 'Invalid status transition.');
    }
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    if (!id || !currentOrgId || !assigneeId) return;
    try {
      await assignIncident({
        organizationId: currentOrgId,
        incidentId: id,
        assigneeId,
      }).unwrap();
    } catch {
      // Error handled by RTK Query
    }
  };

  const assignedMember = members.find((m) => m.user_id === incident.assignee_id);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back button & Breadcrumb */}
      <div>
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Incidents
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">{incident.title}</h1>
              <StatusBadge status={incident.status} />
              <SeverityBadge severity={incident.severity} />
            </div>
            <p className="text-xs text-zinc-400">
              Service ID: <span className="text-zinc-200 font-mono font-medium">{incident.service_id}</span>
              {incident.created_at && ` • Declared ${new Date(incident.created_at).toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>

      {/* State Machine Transition Bar & Assignee */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        {transitionError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
            {transitionError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Transitions */}
          <div>
            <span className="text-xs font-semibold uppercase text-zinc-400 block mb-2">
              Valid Status Transitions:
            </span>
            {availableTransitions.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {availableTransitions.map((nextSt) => (
                  <button
                    key={nextSt}
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(nextSt)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition capitalize cursor-pointer disabled:opacity-50"
                  >
                    &rarr; Mark as {nextSt}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs text-zinc-500 italic">
                Incident is in terminal state ({incident.status}). No further transitions allowed.
              </span>
            )}
          </div>

          {/* Assignee Selection */}
          <div className="sm:w-64">
            <span className="text-xs font-semibold uppercase text-zinc-400 block mb-2">
              Assignee
            </span>
            <select
              value={incident.assignee_id || ''}
              disabled={isAssigning}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name} ({m.role})
                </option>
              ))}
            </select>
            {assignedMember && (
              <p className="text-[11px] text-zinc-500 mt-1">
                Currently assigned to {assignedMember.full_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Incident Description */}
      {incident.description && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Description</h3>
          <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{incident.description}</p>
        </div>
      )}

      {/* Timeline and Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentTimeline events={incident.events || []} />
        <CommentThread
          organizationId={currentOrgId}
          incidentId={incident.id}
          comments={incident.comments || []}
        />
      </div>
    </div>
  );
};

export default IncidentDetailPage;
