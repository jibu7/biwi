'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FormData = {
  email: string;
  password: string;
  otp_code?: string;
};

export default function PlatformLoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const { login, isLoading } = usePlatformAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [needsMFA, setNeedsMFA] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    try {
      setLoginError(null);
      await login(data.email, data.password);
      router.push('/platform/dashboard');
    } catch (error) {
      if ((error as Error).message === 'MFA_REQUIRED') {
        setNeedsMFA(true);
        setLoginError('Please enter your MFA code');
      } else {
        setLoginError((error as Error).message || 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Platform Administration</CardTitle>
          <p className="text-gray-400">Log in to access platform controls</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Email Address</label>
              <Input
                {...register('email', { required: 'Email is required' })}
                type="email"
                className="bg-gray-700 text-white border-gray-600"
                placeholder="admin@example.com"
              />
              {errors.email && (
                <p className="text-red-500 mt-1 text-sm">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  className="bg-gray-700 text-white border-gray-600 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 mt-1 text-sm">{errors.password.message}</p>
              )}
            </div>
            
            {needsMFA && (
              <div>
                <label className="block text-gray-300 mb-2">MFA Code</label>
                <Input
                  {...register('otp_code', { required: 'MFA code is required' })}
                  type="text"
                  className="bg-gray-700 text-white border-gray-600"
                  placeholder="6-digit code"
                />
                {errors.otp_code && (
                  <p className="text-red-500 mt-1 text-sm">{errors.otp_code.message}</p>
                )}
              </div>
            )}
            
            {loginError && (
              <div className="p-3 bg-red-900/50 border border-red-500 rounded">
                <p className="text-red-400 text-sm">{loginError}</p>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <a href="/login" className="text-indigo-400 hover:underline text-sm">
              Return to company login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
