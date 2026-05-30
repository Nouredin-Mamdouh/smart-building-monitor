import type { NextAuthConfig } from "next-auth";
import { DEFAULT_APP_ROUTE } from "@/lib/auth-redirect";

const protectedPaths = ["/dashboard", "/rooms", "/floor-plan", "/sensors", "/alerts", "/users-roles"];

function isProtectedPath(pathname: string) {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isLoginPage = nextUrl.pathname === "/login";

      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL(DEFAULT_APP_ROUTE, nextUrl));
      }

      if (isProtectedPath(nextUrl.pathname)) {
        return isLoggedIn;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
