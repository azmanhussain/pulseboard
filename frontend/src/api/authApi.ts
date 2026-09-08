import { baseApi } from './baseApi';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => {
        const formData = new URLSearchParams();
        formData.append('username', credentials.email);
        if (credentials.password) {
          formData.append('password', credentials.password);
        }
        return {
          url: '/auth/login',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        };
      },
      transformResponse: (response: { access_token: string; token_type: string }) => {
        return {
          token: response.access_token,
          access_token: response.access_token,
          token_type: response.token_type,
          user: null,
        };
      },
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation<User, RegisterCredentials>({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
} = authApi;
