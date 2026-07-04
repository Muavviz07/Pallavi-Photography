import type { NextAuthConfig } from "next-auth";

function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

async function refreshAccessToken(token: any) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(
      `${apiUrl}/api/auth/refresh-token?refresh_token=${token.refreshToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    const decoded = decodeJwt(refreshedTokens.access_token);
    const expiresAt = decoded && decoded.exp ? decoded.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      accessTokenExpires: expiresAt,
      role: decoded?.role ?? token.role,
      status: decoded?.status ?? token.status,
      permissions: decoded?.permissions ?? token.permissions,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDelqPortal = nextUrl.pathname.startsWith("/delq-portal");
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnClientPortal = nextUrl.pathname.startsWith("/client-portal");
      
      if (isOnDelqPortal || isOnDashboard) {
        if (isLoggedIn) {
          const role = (auth.user as any)?.role;
          if (role === "super_admin") return true;
          if (role === "admin") {
            // Check feature-level permission mapping
            const permissions = (auth.user as any)?.permissions || [];
            const pathParts = nextUrl.pathname.split("/"); // e.g. ["", "delq-portal", "blogs"]
            if (pathParts.length > 2) {
              const section = pathParts[2];
              const featureMap: Record<string, string> = {
                "galleries": "galleries",
                "bookings": "bookings",
                "pricing": "pricing",
                "faqs": "faqs",
                "contact": "contact",
                "blogs": "blogs",
                "enquiries": "enquiries",
                "users": "users",
                "analytics": "analytics"
              };
              const requiredFeature = featureMap[section];
              if (requiredFeature && !permissions.includes(requiredFeature)) {
                return false; // Access denied: redirect to login or show error
              }
            }
            return true;
          }
        }
        return false;
      }
      
      if (isOnClientPortal) {
        if (isLoggedIn) {
          const role = (auth.user as any)?.role;
          return role === "client" || role === "admin" || role === "super_admin";
        }
        return false;
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.permissions = (user as any).permissions || [];
        
        const decoded = decodeJwt((user as any).accessToken);
        if (decoded && decoded.exp) {
          token.accessTokenExpires = decoded.exp * 1000;
        }
      }

      // If there was previously a refresh error, don't attempt to refresh again
      if (token.error === "RefreshAccessTokenError") {
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, refresh it
      const refreshed = await refreshAccessToken(token);
      
      if (refreshed.accessToken && (!refreshed.role || !refreshed.permissions)) {
        const decoded = decodeJwt(refreshed.accessToken);
        if (decoded) {
          refreshed.role = decoded.role || refreshed.role;
          refreshed.status = decoded.status || refreshed.status;
          refreshed.permissions = decoded.permissions || refreshed.permissions;
        }
      }
      
      return refreshed;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).accessToken = token.accessToken;
        (session as any).error = token.error;
        if (session.user) {
          (session.user as any).role = token.role;
          (session.user as any).status = token.status;
          (session.user as any).permissions = token.permissions || [];
        }
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
