import type { NextAuthConfig } from "next-auth";

const protectedPaths = [
  "/dashboard",
  "/rooms",
  "/floor-plan",
  "/sensors",
  "/alerts",
  "/access",
  "/users",
  "/profile",
  "/users-roles",
];

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

      if (isProtectedPath(nextUrl.pathname)) {
        return isLoggedIn;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
