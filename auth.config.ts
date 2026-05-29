import type { NextAuthConfig } from "next-auth";

const protectedPaths = ["/", "/rooms", "/floor-plan", "/sensors", "/alerts"];

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
        return Response.redirect(new URL("/", nextUrl));
      }

      if (isProtectedPath(nextUrl.pathname)) {
        return isLoggedIn;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
