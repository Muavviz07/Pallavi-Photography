"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { LanguageProvider } from "@/components/LanguageProvider";
import { useAutoTranslate } from "@/lib/hooks/useAutoTranslate";

function ProvidersContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  useAutoTranslate();

  useEffect(() => {
    if (session && (session as any).error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: "/login?error=SessionExpired" });
    }
  }, [session]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }));

  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      basePath="/api/auth"
    >
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ProvidersContent>
            {children}
          </ProvidersContent>
        </LanguageProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
