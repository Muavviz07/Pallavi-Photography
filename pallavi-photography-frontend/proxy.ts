import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export function proxy(req: any) {
  return auth(req);
}

export const config = {
  matcher: ["/dashboard/:path*", "/client-portal/:path*"],
};
