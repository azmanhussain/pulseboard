import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { useWebSocket } from '../hooks/useWebSocket';
import { useCurrentOrganization } from '../hooks/useCurrentOrganization';
import { useCreateOrganizationMutation } from '../api/organizationsApi';
import type { Organization } from '../types';

export const DashboardLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { organizations, currentOrg, currentOrgId, setCurrentOrgId, addKnownOrg } = useCurrentOrganization();
  const [createOrganization, { isLoading: isCreatingOrg }] = useCreateOrganizationMutation();

  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [orgError, setOrgError] = useState<string | null>(null);

  const { isConnected } = useWebSocket({ organizationId: currentOrgId });

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    try {
      setOrgError(null);
      const slug = newOrgSlug.trim() || newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const created = await createOrganization({ name: newOrgName.trim(), slug }).unwrap();
      addKnownOrg(created);
      setNewOrgName('');
      setNewOrgSlug('');
      setIsOrgModalOpen(false);
    } catch (err: unknown) {
      const errorData = (err as { data?: { detail?: string } })?.data;
      setOrgError(errorData?.detail || 'Failed to create organization.');
    }
  };

  const navItems = [
    {
      to: '/services',
      label: 'Services',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
    },
    {
      to: '/incidents',
      label: 'Incidents',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      to: '/members',
      label: 'Members',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md flex flex-col justify-between">
        <div>
          {/* Brand & Connection status */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                P
              </div>
              <span className="font-semibold text-lg tracking-tight text-white">Pulseboard</span>
            </div>
            <span
              title={isConnected ? 'Live WebSocket Connected' : 'Connecting to Live Updates...'}
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500 animate-pulse'
              }`}
            />
          </div>

          {/* Org Selector */}
          <div className="p-4 border-b border-zinc-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs uppercase font-semibold text-zinc-400">Organization</span>
              <button
                onClick={() => setIsOrgModalOpen(true)}
                title="Create New Organization"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
              >
                + New
              </button>
            </div>
            <div className="space-y-2">
              {organizations.length > 0 ? (
                <select
                  value={currentOrgId}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      const customId = prompt('Enter Organization UUID:', currentOrgId);
                      if (customId && customId.trim()) setCurrentOrgId(customId.trim());
                    } else {
                      setCurrentOrgId(e.target.value);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {organizations.map((org: Organization) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                      {/* {org.name} ({org.id.slice(0, 8)}...) */}
                    </option>
                  ))}
                  <option value="__custom__">⚙️ Enter custom Org UUID...</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Org UUID"
                    value={currentOrgId}
                    onChange={(e) => setCurrentOrgId(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-medium text-zinc-300">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email || 'admin@pulseboard.io'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400">
              Active Organization: <strong className="text-zinc-200">{currentOrg?.name || 'None selected'}</strong>
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>

      {/* Create Org Modal */}
      {isOrgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Create Organization</h2>

            {orgError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
                {orgError}
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Organization Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Acme Corp"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  placeholder="acme-corp"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOrgModalOpen(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOrg}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition cursor-pointer"
                >
                  {isCreatingOrg ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
