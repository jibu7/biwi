"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlatformAuthStore } from "@/store/platformAuthStore";

export default function PlatformAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, isLoading, isAuthenticated, initAuth } = usePlatformAuthStore();
  const router = useRouter();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/platform-login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
