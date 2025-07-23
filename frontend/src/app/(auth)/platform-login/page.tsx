'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { Shield, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(120,119,198,0.3),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.1),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(120,119,198,0.2),_transparent_50%)]" />
      </div>

      {/* Animated particles/dots background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '20%', left: '10%', animationDelay: '0s' }} />
        <div className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ top: '60%', left: '20%', animationDelay: '1s' }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '40%', left: '80%', animationDelay: '2s' }} />
        <div className="absolute w-1 h-1 bg-blue-300 rounded-full animate-pulse" style={{ top: '80%', left: '70%', animationDelay: '1.5s' }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '30%', left: '90%', animationDelay: '0.5s' }} />
      </div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Logo and branding section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl mb-6 group hover:scale-105 transition-transform duration-300">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Platform Administration
            </h1>
            <p className="text-slate-300 text-sm">
              Secure access to platform controls
            </p>
          </div>

          {/* Main login card */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Email Address
                  </label>
                  <Input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/15 focus:border-blue-400/50 transition-all duration-300"
                    placeholder="admin@example.com"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full" />
                      {errors.email.message}
                    </p>
                  )}
                </div>
                
                {/* Password field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      {...register('password', { required: 'Password is required' })}
                      type={showPassword ? 'text' : 'password'}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/15 focus:border-blue-400/50 transition-all duration-300 pr-12"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full" />
                      {errors.password.message}
                    </p>
                  )}
                </div>
                
                {/* MFA field (conditional) */}
                {needsMFA && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-slate-200">
                      MFA Code
                    </label>
                    <Input
                      {...register('otp_code', { required: 'MFA code is required' })}
                      type="text"
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/15 focus:border-blue-400/50 transition-all duration-300 text-center tracking-widest"
                      placeholder="••••••"
                      maxLength={6}
                      autoComplete="one-time-code"
                    />
                    {errors.otp_code && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-400 rounded-full" />
                        {errors.otp_code.message}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Error message */}
                {loginError && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                      <p className="text-red-400 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                        {loginError}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Return link */}
          <div className="mt-8 text-center">
            <a 
              href="/login" 
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-sm transition-colors duration-200 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
              Return to company login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
