"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }));

  useEffect(() => {
    if (session && (session as any).error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: "/login?error=SessionExpired" });
    }
  }, [session]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
