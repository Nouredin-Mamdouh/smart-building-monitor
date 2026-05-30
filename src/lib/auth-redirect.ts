const DEFAULT_APP_ROUTE = "/dashboard";
const allowedCallbackPrefixes = [
  "/dashboard",
  "/floor-plan",
  "/rooms",
  "/sensors",
  "/alerts",
  "/access",
  "/users",
  "/profile",
  "/users-roles",
];

export function normalizeCallbackUrl(value: FormDataEntryValue | string | undefined | null) {
  if (typeof value !== "string" || value.length === 0) {
    return DEFAULT_APP_ROUTE;
  }

  let pathname = value;

  try {
    const parsedUrl = new URL(value);
    pathname = `${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    pathname = value;
  }

  if (!pathname.startsWith("/")) {
    return DEFAULT_APP_ROUTE;
  }

  if (allowedCallbackPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return pathname;
  }

  return DEFAULT_APP_ROUTE;
}

export { DEFAULT_APP_ROUTE };
