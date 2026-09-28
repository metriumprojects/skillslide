/**
 * Utility functions for handling post-login and post-registration redirects.
 * Ensures users attempting to book a lesson/curriculum are redirected back to the
 * booking page, while regular logins go to the home screen.
 */

const REDIRECT_STORAGE_KEY = "redirect_after_auth";

/**
 * Set the target URL to redirect to after successful authentication.
 * Ignored if URL is login or register itself.
 */
export const setAuthRedirect = (targetUrl) => {
  if (typeof window === "undefined" || !targetUrl) return;
  const url = String(targetUrl).trim();
  if (url && !url.startsWith("/login") && !url.startsWith("/register")) {
    try {
      sessionStorage.setItem(REDIRECT_STORAGE_KEY, url);
    } catch {
      // Ignore quota/privacy errors
    }
  }
};

/**
 * Clear any stored redirect URL.
 */
export const clearAuthRedirect = () => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
};

/**
 * Resolve the post-authentication redirect destination in priority order:
 * 1. React Router location.state.from
 * 2. URL query param ?redirect=...
 * 3. sessionStorage redirect_after_auth
 * 4. Default fallback: "/" (Home page)
 */
export const getAuthRedirect = (location, searchParams, defaultFallback = "/") => {
  // 1. Check React Router location state
  const from = location?.state?.from;
  if (from) {
    if (typeof from === "string") {
      const trimmed = from.trim();
      if (trimmed && !trimmed.startsWith("/login") && !trimmed.startsWith("/register")) {
        return trimmed;
      }
    } else if (typeof from === "object" && from.pathname) {
      const fullPath = `${from.pathname}${from.search || ""}${from.hash || ""}`;
      if (!fullPath.startsWith("/login") && !fullPath.startsWith("/register")) {
        return fullPath;
      }
    }
  }

  // 2. Check URL search param (?redirect=...)
  const redirectParam = searchParams?.get?.("redirect");
  if (redirectParam) {
    try {
      const decoded = decodeURIComponent(redirectParam).trim();
      if (decoded && !decoded.startsWith("/login") && !decoded.startsWith("/register")) {
        return decoded;
      }
    } catch {
      if (redirectParam && !redirectParam.startsWith("/login") && !redirectParam.startsWith("/register")) {
        return redirectParam;
      }
    }
  }

  // 3. Check sessionStorage
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
      if (stored) {
        const trimmed = stored.trim();
        if (trimmed && !trimmed.startsWith("/login") && !trimmed.startsWith("/register")) {
          return trimmed;
        }
      }
    } catch {
      // Ignore errors
    }
  }

  // 4. Default fallback
  return defaultFallback;
};
