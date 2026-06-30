import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnClientPortal = nextUrl.pathname.startsWith("/client-portal");
      
      if (isOnDashboard) {
        if (isLoggedIn) {
          const role = (auth.user as any)?.role;
          return role === "admin";
        }
        return false;
      }
      
      if (isOnClientPortal) {
        if (isLoggedIn) {
          const role = (auth.user as any)?.role;
          return role === "client" || role === "admin";
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).accessToken = token.accessToken;
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
