"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { duration, ease, reducedMotionQuery } from "@/lib/motion";
import { navLinks } from "@/lib/site";
import { Magnetic } from "@/components/foundation/Magnetic";
import type { ChapterCard } from "@/components/foundation/Curtain";
import { Menu } from "@/components/foundation/Menu";
import { useSmoothScroll } from "@/components/foundation/SmoothScroll";
import { TransitionLink } from "@/components/foundation/TransitionLink";
import { usePageTransition } from "@/components/foundation/TransitionProvider";
import { TextLink } from "@/components/ui/TextLink";

const desktopQuery = "(min-width: 768px)";
const BUTTON_IN_AT = 0.15; // s, the button scales in just after the bar starts to leave
const ICON_DURATION = 0.5; // s, hamburger ↔ X
const ICON_EASE = "expo.inOut";
const ICON_LINE_OFFSET = 3; // px, half the gap between the two lines

// Top bar + round menu button + fullscreen menu.
// Desktop: the bar shows at the top; past one viewport it slides away and the menu button scales in.
// Mobile: only the menu button, always.
export function Nav() {
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const buttonLayer = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const lineTop = useRef<HTMLSpanElement>(null);
  const lineBottom = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLElement>(null);
  const pending = useRef<{ href: string; card?: ChapterCard } | null>(null);
  const { stop, start } = useSmoothScroll();
  const { navigate } = usePageTransition();

  // Menu links: close first, navigate once the close animation is done (see onClosed).
  const onMenuNavigate = useCallback((href: string, card?: ChapterCard) => {
    pending.current = { href, card };
    setOpen(false);
  }, []);

  const onClosed = useCallback(() => {
    start();
    button.current?.focus({ preventScroll: true });
    const target = pending.current;
    pending.current = null;
    if (target) navigate(target.href, target.card);
  }, [navigate, start]);

  // Desktop: swap the bar for the menu button past one viewport height. Reverses on the way back up.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ desktop: desktopQuery, reduce: reducedMotionQuery }, (context) => {
        const { desktop, reduce } = context.conditions!;
        if (!desktop) return;

        const swap = gsap.timeline({ paused: true });
        if (reduce) {
          const fade = { duration: duration.fade, ease: ease.linear };
          swap
            .to(bar.current, { autoAlpha: 0, ...fade }, 0)
            .fromTo(toggle.current, { autoAlpha: 0 }, { autoAlpha: 1, ...fade }, 0);
        } else {
          const enter = { duration: duration.base, ease: ease.out };
          swap
            .to(bar.current, { yPercent: -100, autoAlpha: 0, ...enter }, 0)
            .fromTo(toggle.current, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, ...enter }, BUTTON_IN_AT);
        }

        ScrollTrigger.create({
          start: () => window.innerHeight,
          // Keep end past start, so a page shorter than two viewports never reads as "scrolled past".
          end: () => Math.max(ScrollTrigger.maxScroll(window), window.innerHeight) + 1,
          onEnter: () => swap.play(),
          onLeaveBack: () => swap.reverse(),
        });
        // Loaded or restored mid-page: start in the scrolled state without animating.
        if (window.scrollY >= window.innerHeight) swap.progress(1);
      });
      return () => mm.revert();
    },
    { scope: bar },
  );

  // Hamburger ↔ X.
  useGSAP(
    () => {
      const reduce = window.matchMedia(reducedMotionQuery).matches;
      const morph = { duration: reduce ? 0 : ICON_DURATION, ease: ICON_EASE };
      gsap.to(lineTop.current, { y: open ? ICON_LINE_OFFSET : 0, rotation: open ? 45 : 0, ...morph });
      gsap.to(lineBottom.current, { y: open ? -ICON_LINE_OFFSET : 0, rotation: open ? -45 : 0, ...morph });
    },
    { dependencies: [open], scope: buttonLayer },
  );

  // While open: freeze scroll, make the page inert, trap Tab, close on Esc.
  useEffect(() => {
    if (!open) return;
    stop();
    const content = document.getElementById("content");
    const barEl = bar.current;
    content?.setAttribute("inert", "");
    barEl?.setAttribute("inert", "");

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panel.current || !button.current) return;
      const items = [button.current, ...panel.current.querySelectorAll<HTMLElement>("a[href], button")];
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!active || !items.includes(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      content?.removeAttribute("inert");
      barEl?.removeAttribute("inert");
    };
  }, [open, stop]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-70">
        <div ref={bar} className="container-site pointer-events-auto hidden h-24 items-center justify-between md:flex">
          <TransitionLink href="/" className="font-display text-sm tracking-label text-snow">
            IHTISHAM HASSAN
          </TransitionLink>
          <nav aria-label="Primary">
            <ul className="flex items-center gap-10">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <TextLink href={link.href} chapter={link.chapter} title={link.title} className="label">
                    {link.label}
                  </TextLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* Above the menu (z-index), so the same button morphs into the close control.
          Before it in the DOM, so Tab goes from the button straight into the menu. */}
      <div ref={buttonLayer} className="pointer-events-none fixed inset-x-0 top-0 z-90">
        <div className="container-site flex h-24 items-center justify-end">
          {/* Hidden on desktop until GSAP swaps it in; always shown on mobile. */}
          <div ref={toggle} className="pointer-events-auto md:invisible">
            <Magnetic>
              <button
                ref={button}
                type="button"
                aria-expanded={open}
                aria-controls="site-menu"
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((value) => !value)}
                className="flex size-13 cursor-pointer items-center justify-center rounded-full border-[0.5px] border-slate bg-iron"
              >
                <span aria-hidden="true" className="relative block h-1.75 w-5">
                  <span ref={lineTop} className="absolute inset-x-0 top-0 h-px bg-snow" />
                  <span ref={lineBottom} className="absolute inset-x-0 bottom-0 h-px bg-snow" />
                </span>
              </button>
            </Magnetic>
          </div>
        </div>
      </div>

      <Menu open={open} panelRef={panel} originRef={button} onNavigate={onMenuNavigate} onClosed={onClosed} />
    </>
  );
}
