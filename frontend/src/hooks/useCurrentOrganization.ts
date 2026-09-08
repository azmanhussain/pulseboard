import { useState, useEffect } from 'react';
import { useGetMeQuery } from '../api/authApi';
import { useGetOrganizationQuery } from '../api/organizationsApi';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { updateUser } from '../features/auth/authSlice';
import type { Organization } from '../types';

export function useCurrentOrganization() {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);

  // Fetch current user details from /auth/me
  const { data: meData } = useGetMeQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (meData && JSON.stringify(meData) !== JSON.stringify(user)) {
      dispatch(updateUser(meData));
    }
  }, [meData, user, dispatch]);

  const [currentOrgId, setCurrentOrgIdState] = useState<string>(() => {
    return (
      localStorage.getItem('selectedOrgId') ||
      user?.organization_id ||
      user?.organizationId ||
      meData?.organization_id ||
      meData?.organizationId ||
      ''
    );
  });

  useEffect(() => {
    const orgIdFromUser =
      user?.organization_id ||
      user?.organizationId ||
      meData?.organization_id ||
      meData?.organizationId;

    if (!currentOrgId && orgIdFromUser) {
      setCurrentOrgIdState(orgIdFromUser);
      localStorage.setItem('selectedOrgId', orgIdFromUser);
    }
  }, [user, meData, currentOrgId]);

  const setCurrentOrgId = (id: string) => {
    setCurrentOrgIdState(id);
    localStorage.setItem('selectedOrgId', id);
  };

  // Fetch the real organization from the backend — this is the source of truth
  // for the name, rather than guessing from whatever happens to be in localStorage.
  const { data: fetchedOrg, isLoading: isOrgLoading } = useGetOrganizationQuery(currentOrgId, {
    skip: !currentOrgId,
  });

  // localStorage is now only used for a lightweight "recently used org IDs" list
  // for the dropdown — NOT as the source of truth for names. Every org's displayed
  // name always comes from the live backend query above.
  const storedOrgs: Organization[] = (() => {
    try {
      const orgsStr = localStorage.getItem('knownOrgs');
      return orgsStr ? JSON.parse(orgsStr) : [];
    } catch {
      return [];
    }
  })();

  // Keep the locally-cached list fresh whenever we successfully fetch an org's
  // real data, so previously-visited orgs still show a correct name in the
  // dropdown even before their own query has run again this session.
  useEffect(() => {
    if (fetchedOrg) {
      const updated = [fetchedOrg, ...storedOrgs.filter((o) => o.id !== fetchedOrg.id)];
      localStorage.setItem('knownOrgs', JSON.stringify(updated));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedOrg]);

  const currentOrg: Organization | null =
    fetchedOrg ||
    storedOrgs.find((o) => o.id === currentOrgId) ||
    (currentOrgId
      ? {
          id: currentOrgId,
          name: isOrgLoading ? 'Loading…' : `Organization (${currentOrgId.slice(0, 8)}…)`,
          slug: '',
        }
      : null);

  const addKnownOrg = (org: Organization) => {
    const updated = [org, ...storedOrgs.filter((o) => o.id !== org.id)];
    localStorage.setItem('knownOrgs', JSON.stringify(updated));
    setCurrentOrgId(org.id);
  };

  return {
    organizations: currentOrg ? [currentOrg, ...storedOrgs.filter((o) => o.id !== currentOrg.id)] : storedOrgs,
    currentOrg,
    currentOrgId,
    setCurrentOrgId,
    addKnownOrg,
    isLoading: isOrgLoading,
  };
}

export default useCurrentOrganization;