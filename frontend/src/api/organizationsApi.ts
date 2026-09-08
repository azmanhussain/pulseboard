import { baseApi } from './baseApi';
import type { Organization, OrganizationMember, AddMemberPayload } from '../types';

export const organizationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrganization: builder.mutation<Organization, { name: string; slug: string }>({
      query: (body) => ({
        url: '/organizations',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Organization', id: 'LIST' }],
    }),
    getOrganization: builder.query<Organization, string>({
      query: (organizationId) => `/organizations/${organizationId}`,
      providesTags: (_result, _error, organizationId) => [
        { type: 'Organization', id: organizationId },
      ],
    }),
    getOrganizationMembers: builder.query<OrganizationMember[], string>({
      query: (organizationId) => `/organizations/${organizationId}/members`,
      providesTags: (_result, _error, organizationId) => [
        { type: 'Member', id: organizationId },
      ],
    }),
    addOrganizationMember: builder.mutation<
      OrganizationMember,
      { organizationId: string; body: AddMemberPayload }
    >({
      query: ({ organizationId, body }) => ({
        url: `/organizations/${organizationId}/members`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: 'Member', id: organizationId },
      ],
    }),
  }),
});

export const {
  useCreateOrganizationMutation,
  useGetOrganizationQuery,
  useGetOrganizationMembersQuery,
  useAddOrganizationMemberMutation,
} = organizationsApi;