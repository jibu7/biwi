'use client';


import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page on initial load
    router.push('/login');
  }, []); // Remove router from dependencies

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4">
          <Logo size="xl" textSize="3xl" />
        </div>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
