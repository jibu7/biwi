'use client';


import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page on initial load
    router.push('/login');
  }, []); // Remove router from dependencies

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
