// Hash router (docs/03-design.md §3). Hash URLs keep GitHub Pages from returning 404
// when a deep link is opened directly.
import { signal } from "@preact/signals";

export const ROUTES = ["/", "/practice", "/session", "/result", "/cards", "/cards/session", "/stats", "/settings"] as const;
export type Route = (typeof ROUTES)[number];

/** Routes shown full screen without the tab bar (B3 focus mode). */
export const FOCUS_ROUTES: readonly Route[] = ["/session", "/result", "/cards/session"];

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, "").split("?")[0] || "/";
  const normalized = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return (ROUTES as readonly string[]).includes(normalized) ? (normalized as Route) : "/";
}

const read = (): Route => (typeof location === "undefined" ? "/" : parseHash(location.hash));

export const route = signal<Route>(read());

export function navigate(to: Route): void {
  if (location.hash !== `#${to}`) location.hash = to;
  // Update immediately so callers can rely on route.value without waiting for hashchange.
  route.value = to;
}

export const href = (to: Route): string => `#${to}`;

if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    route.value = read();
  });
}
