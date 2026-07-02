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
          return role === "admin" || role === "super_admin";
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
        
        const decoded = decodeJwt((user as any).accessToken);
        if (decoded && decoded.exp) {
          token.accessTokenExpires = decoded.exp * 1000;
        }
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired or is close to expiration, refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        (session as any).accessToken = token.accessToken;
        (session as any).error = token.error;
        if (session.user) {
          (session.user as any).role = token.role;
          (session.user as any).status = token.status;
        }
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
