import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: DefaultSession["user"] & {
      role?: string;
      status?: string;
    };
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    status?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    status?: string;
  }
}
