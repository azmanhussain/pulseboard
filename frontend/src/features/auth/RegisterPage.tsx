import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterMutation, useLoginMutation } from '../../api/authApi';
import { useAppDispatch } from '../../app/hooks';
import { setCredentials } from './authSlice';
import type { RegisterCredentials } from '../../types';

export const RegisterPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterCredentials>();
  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: RegisterCredentials) => {
    try {
      setServerError(null);
      // 1. Call POST /auth/register with { email, password, full_name }
      await registerUser({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      }).unwrap();

      // 2. Automatically log the user in after successful registration
      if (data.password) {
        const loginRes = await login({ email: data.email, password: data.password }).unwrap();
        const token = loginRes.token || loginRes.access_token || '';
        dispatch(setCredentials({ token, user: loginRes.user || null }));
        navigate('/services', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err: unknown) {
      const errorData = (err as { data?: { detail?: string | { msg?: string }[]; message?: string } })?.data;
      let errorMsg = 'Registration failed. Please try again.';
      if (typeof errorData?.detail === 'string') {
        errorMsg = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        errorMsg = errorData.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      }
      setServerError(errorMsg);
    }
  };

  const isLoading = isRegistering || isLoggingIn;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 py-12 text-zinc-100">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl text-white mx-auto mb-3 shadow-lg shadow-indigo-500/20">
            P
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create your Pulseboard account</h2>
          <p className="text-sm text-zinc-400 mt-1">Real-time uptime and incident response platform</p>
        </div>

        {serverError && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Jane Doe"
              {...register('full_name', { required: 'Full name is required' })}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {errors.full_name && (
              <p className="text-xs text-rose-400 mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {errors.email && (
              <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {errors.password && (
              <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg shadow-sm transition mt-2 cursor-pointer"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-center text-zinc-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
