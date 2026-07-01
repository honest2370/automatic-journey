import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useReducer,
  type ReactNode,
} from "react";

export type Route = { name: string; params?: Record<string, any> };

interface NavValue {
  route: Route;
  depth: number;
  go: (r: Route) => void;
  replace: (r: Route) => void;
  back: () => void;
}

const NavContext = createContext<NavValue | undefined>(undefined);

export const useNav = () => {
  const c = useContext(NavContext);
  if (!c) throw new Error("useNav must be used within NavProvider");
  return c;
};

/** Parse le pathname pour extraire une route (ex: /admin → { name: "admin" }). */
function parsePathname(): Route | null {
  if (typeof window === "undefined") return null;
  const p = window.location.pathname;
  if (p === "/" || p === "/index.html") return null;
  const seg = p.replace(/^\/+|\/+$/g, "");
  if (!seg) return null;
  // routes connues
  const KNOWN = ["admin", "settings", "services", "store", "orders", "ai", "home"];
  if (KNOWN.includes(seg)) return { name: seg };
  return null;
}

const ROOT: Route = { name: "home" };

export function NavProvider({
  initial = ROOT,
  children,
}: {
  initial?: Route;
  children: ReactNode;
}) {
  const [, force] = useReducer((x) => x + 1, 0);

  // Hydrate depuis l'URL si une route connue est présente (ex: /admin).
  const derived = parsePathname() ?? initial;

  const routeRef = useRef<Route>(derived);
  const depthRef = useRef(0);

  useEffect(() => {
    // Pose l'état initial dans l'historique
    const initState = { d: depthRef.current, route: routeRef.current };
    window.history.replaceState(initState, "");

    const onPop = (e: PopStateEvent) => {
      const d = (e.state?.d as number) ?? 0;
      const r = (e.state?.route as Route) ?? ROOT;
      routeRef.current = r;
      depthRef.current = d;
      force();
      requestAnimationFrame(() => {
        document.getElementById("adf-scroll")?.scrollTo({ top: 0 });
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = useCallback((r: Route) => {
    const nd = depthRef.current + 1;
    const state = { d: nd, route: r };
    window.history.pushState(state, "", `/${r.name}`);
    routeRef.current = r;
    depthRef.current = nd;
    force();
    requestAnimationFrame(() => {
      document.getElementById("adf-scroll")?.scrollTo({ top: 0 });
    });
  }, []);

  /** Remplace la route actuelle sans empiler (utile après login). */
  const replace = useCallback((r: Route) => {
    const state = { d: depthRef.current, route: r };
    window.history.replaceState(state, "", `/${r.name}`);
    routeRef.current = r;
    force();
    requestAnimationFrame(() => {
      document.getElementById("adf-scroll")?.scrollTo({ top: 0 });
    });
  }, []);

  const back = useCallback(() => {
    window.history.back();
  }, []);

  const value: NavValue = {
    route: routeRef.current,
    depth: depthRef.current,
    go,
    replace,
    back,
  };

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
