import { baseApi } from './baseApi';
import type { Service, ServiceCreatePayload, ServiceUpdatePayload } from '../types';

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query<Service[], string>({
      query: (organizationId) => `/organizations/${organizationId}/services`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Service' as const, id })),
              { type: 'Service', id: 'LIST' },
            ]
          : [{ type: 'Service', id: 'LIST' }],
    }),
    getServiceById: builder.query<Service, { organizationId: string; serviceId: string }>({
      query: ({ organizationId, serviceId }) =>
        `/organizations/${organizationId}/services/${serviceId}`,
      providesTags: (_result, _error, { serviceId }) => [{ type: 'Service', id: serviceId }],
    }),
    createService: builder.mutation<Service, { organizationId: string; body: ServiceCreatePayload }>({
      query: ({ organizationId, body }) => ({
        url: `/organizations/${organizationId}/services`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Service', id: 'LIST' }],
    }),
    updateService: builder.mutation<
      Service,
      { organizationId: string; serviceId: string; body: ServiceUpdatePayload }
    >({
      query: ({ organizationId, serviceId, body }) => ({
        url: `/organizations/${organizationId}/services/${serviceId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { serviceId }) => [
        { type: 'Service', id: serviceId },
        { type: 'Service', id: 'LIST' },
      ],
    }),
    deleteService: builder.mutation<void, { organizationId: string; serviceId: string }>({
      query: ({ organizationId, serviceId }) => ({
        url: `/organizations/${organizationId}/services/${serviceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { serviceId }) => [
        { type: 'Service', id: serviceId },
        { type: 'Service', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = servicesApi;
