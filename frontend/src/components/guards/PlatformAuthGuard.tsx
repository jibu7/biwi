"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlatformAuthStore } from "@/store/platformAuthStore";

export default function PlatformAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = usePlatformAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/platform-login");
    }
  }, [token, router]);

  if (!user && token) {
    // If we have a token but no user, we are likely still loading the user data
    return <div>Loading platform session...</div>; // Or a proper loader
  }

  if (!user) {
    return null; // Or a redirect, or a loading spinner
  }

  return <>{children}</>;
}
