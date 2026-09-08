import React, { useState } from 'react';
import {
  useGetOrganizationMembersQuery,
  useAddOrganizationMemberMutation,
} from '../../api/organizationsApi';
import { useCurrentOrganization } from '../../hooks/useCurrentOrganization';
import { useAppSelector } from '../../app/hooks';
import type { UserRole, OrganizationMember } from '../../types';

export const MembersPage: React.FC = () => {
  const { currentOrgId, currentOrg } = useCurrentOrganization();
  const { user } = useAppSelector((state) => state.auth);

  const {
    data: members = [],
    isLoading,
    error,
  } = useGetOrganizationMembersQuery(currentOrgId, { skip: !currentOrgId });

  const [addMember, { isLoading: isAdding }] = useAddOrganizationMemberMutation();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('engineer');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentMember = members.find((m) => m.user_id === user?.id || m.email === user?.email);
  const isAdmin = currentMember?.role === 'admin' || user?.role === 'admin';

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !currentOrgId) return;

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await addMember({
        organizationId: currentOrgId,
        body: { email, role },
      }).unwrap();
      setSuccessMessage(`Added ${email} to ${currentOrg?.name || 'organization'}`);
      setEmail('');
    } catch (err: unknown) {
      const errorData = (err as { data?: { detail?: string } })?.data;
      setErrorMessage(errorData?.detail || 'Failed to add member to organization.');
    }
  };

  if (!currentOrgId) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-2">Organization Required</h2>
          <p className="text-sm text-zinc-400">
            Please select or create an organization to view team members.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Organization Members</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage team access and roles for{' '}
          <span className="text-zinc-200 font-medium">{currentOrg?.name || 'Organization'}</span>
        </p>
      </div>

      {/* Admin Add Member Card */}
      {isAdmin && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Add Team Member</h2>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="email"
              required
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-32 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="engineer">Engineer</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={isAdding}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
              >
                {isAdding ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Current Members</h3>
          <span className="text-xs text-zinc-500">{members.length} members</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-zinc-500 text-sm">Loading members...</div>
        ) : error ? (
          <div className="p-6 text-rose-400 text-sm">
            Failed to load members or you are not a member of this organization.
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">No members found.</div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {members.map((m: OrganizationMember) => (
              <div key={m.user_id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
                    {m.full_name ? m.full_name[0].toUpperCase() : 'M'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{m.full_name}</p>
                    <p className="text-xs text-zinc-500">{m.email}</p>
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-md border tracking-wider ${
                    m.role === 'admin'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : m.role === 'engineer'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                  }`}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersPage;
