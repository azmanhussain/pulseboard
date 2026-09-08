import { baseApi } from './baseApi';
import type {
  Incident,
  IncidentDetail,
  IncidentCreatePayload,
  IncidentStatus,
  Comment,
} from '../types';

export const incidentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncidents: builder.query<Incident[], string>({
      query: (organizationId) => `/organizations/${organizationId}/incidents`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Incident' as const, id })),
              { type: 'Incident', id: 'LIST' },
            ]
          : [{ type: 'Incident', id: 'LIST' }],
    }),
    getIncidentById: builder.query<
      IncidentDetail,
      { organizationId: string; incidentId: string }
    >({
      query: ({ organizationId, incidentId }) =>
        `/organizations/${organizationId}/incidents/${incidentId}`,
      providesTags: (_result, _error, { incidentId }) => [{ type: 'Incident', id: incidentId }],
    }),
    createIncident: builder.mutation<
      Incident,
      { organizationId: string; body: IncidentCreatePayload }
    >({
      query: ({ organizationId, body }) => ({
        url: `/organizations/${organizationId}/incidents`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Incident', id: 'LIST' }],
    }),
    updateIncidentStatus: builder.mutation<
      Incident,
      { organizationId: string; incidentId: string; status: IncidentStatus }
    >({
      query: ({ organizationId, incidentId, status }) => ({
        url: `/organizations/${organizationId}/incidents/${incidentId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      async onQueryStarted({ organizationId, incidentId, status }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          incidentsApi.util.updateQueryData('getIncidentById', { organizationId, incidentId }, (draft) => {
            draft.status = status;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, { incidentId }) => [
        { type: 'Incident', id: incidentId },
        { type: 'Incident', id: 'LIST' },
      ],
    }),
    assignIncident: builder.mutation<
      Incident,
      { organizationId: string; incidentId: string; assigneeId: string }
    >({
      query: ({ organizationId, incidentId, assigneeId }) => ({
        url: `/organizations/${organizationId}/incidents/${incidentId}/assign`,
        method: 'PATCH',
        body: { assignee_id: assigneeId },
      }),
      invalidatesTags: (_result, _error, { incidentId }) => [
        { type: 'Incident', id: incidentId },
        { type: 'Incident', id: 'LIST' },
      ],
    }),
    addComment: builder.mutation<
      Comment,
      { organizationId: string; incidentId: string; body: string }
    >({
      query: ({ organizationId, incidentId, body }) => ({
        url: `/organizations/${organizationId}/incidents/${incidentId}/comments`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: (_result, _error, { incidentId }) => [
        { type: 'Incident', id: incidentId },
      ],
    }),
  }),
});

export const {
  useGetIncidentsQuery,
  useGetIncidentByIdQuery,
  useCreateIncidentMutation,
  useUpdateIncidentStatusMutation,
  useAssignIncidentMutation,
  useAddCommentMutation,
} = incidentsApi;
