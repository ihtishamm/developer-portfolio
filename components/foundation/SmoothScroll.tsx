"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import Lenis, { type ScrollToOptions } from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { finePointerMotionQuery } from "@/lib/motion";

const LERP = 0.08;
// GSAP's default lag smoothing, restored when Lenis is torn down.
const DEFAULT_LAG_THRESHOLD = 500;
const DEFAULT_LAG_ADJUSTED = 33;

type ScrollTarget = number | string | HTMLElement;

export type SmoothScrollApi = {
  /** Freeze scrolling (modals, menus, preloader). */
  stop: () => void;
  start: () => void;
  scrollTo: (target: ScrollTarget, options?: ScrollToOptions) => void;
};

const SmoothScrollContext = createContext<SmoothScrollApi | null>(null);

export function useSmoothScroll() {
  const api = useContext(SmoothScrollContext);
  if (!api) throw new Error("useSmoothScroll must be used inside <SmoothScroll>");
  return api;
}

function resolveTop(target: ScrollTarget, offset = 0) {
  if (typeof target === "number") return target + offset;
  const el = typeof target === "string" ? document.querySelector(target) : target;
  return el ? el.getBoundingClientRect().top + window.scrollY + offset : null;
}

// One global Lenis instance, driven by gsap.ticker and synced to ScrollTrigger.
// Not created on touch devices or under reduced motion; the API falls back to native scrolling there.
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(finePointerMotionQuery, () => {
      const lenis = new Lenis({ lerp: LERP, smoothWheel: true, autoRaf: false });
      lenisRef.current = lenis;

      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      return () => {
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(DEFAULT_LAG_THRESHOLD, DEFAULT_LAG_ADJUSTED);
        lenis.destroy();
        lenisRef.current = null;
      };
    });
    return () => mm.revert();
  });

  // Stable object: consumers never re-render because of scrolling.
  const api = useMemo<SmoothScrollApi>(
    () => ({
      stop: () => {
        if (lenisRef.current) lenisRef.current.stop();
        else document.documentElement.style.overflow = "hidden";
      },
      start: () => {
        if (lenisRef.current) lenisRef.current.start();
        else document.documentElement.style.overflow = "";
      },
      scrollTo: (target, options) => {
        if (lenisRef.current) return lenisRef.current.scrollTo(target, options);
        const top = resolveTop(target, options?.offset);
        if (top !== null) window.scrollTo({ top, behavior: options?.immediate ? "instant" : "auto" });
      },
    }),
    [],
  );

  return <SmoothScrollContext.Provider value={api}>{children}</SmoothScrollContext.Provider>;
}
