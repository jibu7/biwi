'use client';


import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlatformPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/platform/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}
