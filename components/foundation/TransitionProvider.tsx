"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { duration, ease, fullMotionQuery, reducedMotionQuery } from "@/lib/motion";
import { Curtain, type ChapterCard, type CurtainHandle } from "@/components/foundation/Curtain";
import { useSmoothScroll } from "@/components/foundation/SmoothScroll";

const PATHNAME_TIMEOUT = 8000; // ms, give up waiting for the route and lift the curtain anyway

type TransitionApi = {
  /** Same-page targets scroll smoothly; other internal routes play the curtain. */
  navigate: (href: string, card?: ChapterCard) => void;
};

const TransitionContext = createContext<TransitionApi | null>(null);
// Separate so that flipping it re-renders only pages with an entrance, not every link.
// False while the curtain is covering a route change; pages wait for it before their entrance.
const EntranceContext = createContext(true);

export function usePageTransition() {
  const api = useContext(TransitionContext);
  if (!api) throw new Error("usePageTransition must be used inside <TransitionProvider>");
  return api;
}

/**
 * Runs a page's entrance once: immediately on first load, or 0.6s before the curtain finishes leaving.
 * Skipped under reduced motion, where [data-reveal] content is already visible.
 */
export function usePageEntrance(entrance: () => void, scope: RefObject<HTMLElement | null>) {
  const entranceReady = useContext(EntranceContext);
  const played = useRef(false);
  useGSAP(
    () => {
      if (!entranceReady || played.current) return;
      played.current = true;
      if (window.matchMedia(fullMotionQuery).matches) entrance();
    },
    { dependencies: [entranceReady], scope },
  );
}

// Orchestrates route changes: curtain in → route change → scroll reset under the curtain → curtain out,
// with the new page's entrance overlapping the exit. Back/forward play the curtain without a card.
// The first page load has no curtain. Reduced motion swaps the curtain for a 0.4s fade.
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { stop, start, scrollTo } = useSmoothScroll();
  const curtain = useRef<CurtainHandle>(null);
  const [entranceReady, setEntranceReady] = useState(true);
  const busy = useRef(false);
  const pathnameRef = useRef(pathname);
  const onPathname = useRef<(() => void) | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
    const resolve = onPathname.current;
    onPathname.current = null;
    // One frame so the new page has laid out before we scroll and measure.
    if (resolve) requestAnimationFrame(() => resolve());
  }, [pathname]);

  const run = useCallback(
    async (go: () => void, card: ChapterCard | undefined, hash: string) => {
      busy.current = true;
      stop();
      const page = document.getElementById("content");
      const reduce = window.matchMedia(reducedMotionQuery).matches;

      const routeChanged = new Promise<void>((resolve) => {
        onPathname.current = resolve;
        setTimeout(resolve, PATHNAME_TIMEOUT);
      });

      const resetScroll = () => {
        gsap.set(page, { clearProps: "transform,transformOrigin" });
        const target = hash ? document.getElementById(hash.slice(1)) : null;
        scrollTo(target ?? 0, { immediate: true, force: true });
        ScrollTrigger.refresh();
      };

      if (reduce || !curtain.current) {
        const fade = { duration: duration.fade, ease: ease.linear };
        await gsap.to(page, { autoAlpha: 0, ...fade });
        setEntranceReady(false);
        go();
        await routeChanged;
        resetScroll();
        setEntranceReady(true);
        start();
        await gsap.to(page, { autoAlpha: 1, ...fade });
      } else {
        const { covered, settled } = curtain.current.enter(page, card);
        await covered;
        // React work happens under the curtain, never on the first frames of the animation.
        setEntranceReady(false);
        go();
        await routeChanged;
        resetScroll();
        gsap.set(page, { clearProps: "opacity,visibility" });
        await settled;
        start();
        await curtain.current.leave(() => setEntranceReady(true));
      }
      busy.current = false;
    },
    [scrollTo, start, stop],
  );

  const navigate = useCallback(
    (href: string, card?: ChapterCard) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.assign(href);
        return;
      }
      if (url.pathname === pathnameRef.current) {
        scrollTo(url.hash || 0);
        return;
      }
      if (busy.current) return;
      void run(() => router.push(href, { scroll: false }), card, url.hash);
    },
    [router, run, scrollTo],
  );

  // Back/forward: hold Next's popstate handler (registered after ours, bubble phase) until the curtain
  // covers the page, then replay the event so Next restores the route from its cache.
  useEffect(() => {
    let replaying = false;
    const onPopState = (e: PopStateEvent) => {
      if (replaying || busy.current || !e.state?.__NA) return;
      if (window.location.pathname === pathnameRef.current) return; // hash-only change
      e.stopImmediatePropagation();
      const state = e.state;
      void run(
        () => {
          replaying = true;
          window.dispatchEvent(new PopStateEvent("popstate", { state }));
          replaying = false;
        },
        undefined,
        "",
      );
    };
    window.addEventListener("popstate", onPopState, { capture: true });
    return () => window.removeEventListener("popstate", onPopState, { capture: true });
  }, [run]);

  const api = useMemo(() => ({ navigate }), [navigate]);

  return (
    <TransitionContext.Provider value={api}>
      <EntranceContext.Provider value={entranceReady}>
        {children}
        <Curtain ref={curtain} />
      </EntranceContext.Provider>
    </TransitionContext.Provider>
  );
}
