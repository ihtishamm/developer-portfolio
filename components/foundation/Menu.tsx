"use client";

import Link from "next/link";
import { useEffect, useRef, type MouseEvent, type RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { duration, ease, reducedMotionQuery, stagger } from "@/lib/motion";
import { navLinks, socialLinks } from "@/lib/site";
import { TextLink } from "@/components/ui/TextLink";

const CIRCLE_DURATION = 1; // s, clip-path circle grow and collapse
const LINK_IN_AT = 0.45; // s into the open timeline
const LINK_IN_DURATION = 1.1;
const SOCIALS_IN_AT = 0.8;
const LINK_OUT_DURATION = 0.5;
const LINK_OUT_STAGGER = 0.04;
const LINK_OUT_EASE = "power3.in";
const MASK_OFFSET = 110; // yPercent, just past the overflow-hidden mask

type MenuProps = {
  open: boolean;
  panelRef: RefObject<HTMLElement | null>;
  /** The menu button: the circle grows out of and collapses back into its centre. */
  originRef: RefObject<HTMLElement | null>;
  onNavigate: (href: string) => void;
  /** Called once the close animation has finished. */
  onClosed: () => void;
};

// Circle that reaches the farthest viewport corner from the menu button's centre.
function circleFrom(origin: HTMLElement | null) {
  const rect = origin?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth;
  const y = rect ? rect.top + rect.height / 2 : 0;
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  return { x, y, r, at: (radius: number) => `circle(${radius}px at ${x}px ${y}px)` };
}

// Fullscreen iron overlay. Opens as a clip-path circle out of the menu button, then the links rise
// out of their masks. Closing reverses: links exit upward, then the circle collapses into the button.
// Nav owns the open state, focus trap and Lenis; this component only animates and renders.
export function Menu({ open, panelRef, originRef, onNavigate, onClosed }: MenuProps) {
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const mounted = useRef(false);
  // Latest callback without re-running the animation effect when it changes.
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  useGSAP(
    () => {
      const panel = panelRef.current!;
      const links = panel.querySelectorAll<HTMLElement>("[data-menu-link]");
      const fades = panel.querySelectorAll<HTMLElement>("[data-menu-fade]");

      if (!mounted.current) {
        mounted.current = true;
        gsap.set(links, { yPercent: MASK_OFFSET });
        gsap.set(fades, { autoAlpha: 0 });
        return;
      }

      timeline.current?.kill();
      const reduce = window.matchMedia(reducedMotionQuery).matches;
      const fade = { duration: duration.fade, ease: ease.linear };

      if (reduce) {
        if (open) {
          gsap.set(panel, { clipPath: "none" });
          gsap.set(links, { yPercent: 0 });
          gsap.set(fades, { autoAlpha: 1 });
          timeline.current = gsap.timeline().to(panel, { autoAlpha: 1, ...fade });
        } else {
          timeline.current = gsap.timeline({ onComplete: () => onClosedRef.current() }).to(panel, { autoAlpha: 0, ...fade });
        }
        return;
      }

      const circle = circleFrom(originRef.current);

      if (open) {
        // From fully closed, start as a dot on the button. If a close was interrupted, grow from where it is.
        if (gsap.getProperty(panel, "visibility") === "hidden") {
          gsap.set(panel, { autoAlpha: 1, clipPath: circle.at(0) });
          gsap.set(links, { yPercent: MASK_OFFSET });
          gsap.set(fades, { autoAlpha: 0 });
        }
        timeline.current = gsap
          .timeline()
          .to(panel, { clipPath: circle.at(circle.r), duration: CIRCLE_DURATION, ease: ease.inOut }, 0)
          // Drop the clip once it covers the viewport, so a resize can't expose the page underneath.
          .set(panel, { clipPath: "none" }, CIRCLE_DURATION)
          .to(links, { yPercent: 0, duration: LINK_IN_DURATION, ease: ease.out, stagger: stagger.lines }, LINK_IN_AT)
          .to(fades, { autoAlpha: 1, duration: duration.base, ease: ease.out }, SOCIALS_IN_AT);
      } else {
        if (panel.style.clipPath === "none") gsap.set(panel, { clipPath: circle.at(circle.r) });
        timeline.current = gsap
          .timeline({
            onComplete: () => {
              gsap.set(panel, { autoAlpha: 0 });
              onClosedRef.current();
            },
          })
          .to(links, { yPercent: -MASK_OFFSET, duration: LINK_OUT_DURATION, ease: LINK_OUT_EASE, stagger: LINK_OUT_STAGGER }, 0)
          .to(fades, { autoAlpha: 0, duration: LINK_OUT_DURATION, ease: LINK_OUT_EASE }, 0)
          .to(panel, { clipPath: circle.at(0), duration: CIRCLE_DURATION, ease: ease.inOut }, LINK_OUT_DURATION);
      }
    },
    { dependencies: [open], scope: panelRef },
  );

  const handleClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let new-tab clicks through
    e.preventDefault();
    onNavigate(href);
  };

  return (
    <nav
      ref={panelRef}
      id="site-menu"
      aria-label="Menu"
      data-lenis-prevent
      className="invisible fixed inset-0 z-80 overflow-y-auto bg-iron"
    >
      <div className="container-site flex min-h-dvh flex-col justify-between gap-12">
        <div className="flex h-24 shrink-0 items-center">
          <Link
            href="/"
            data-menu-fade
            onClick={(e) => handleClick(e, "/")}
            className="font-display text-sm tracking-label text-snow"
          >
            IHTISHAM HASSAN
          </Link>
        </div>

        <ul className="menu-list flex flex-col gap-2 md:gap-4">
          {navLinks.map((link, i) => (
            // Mask: padded so the focus outline isn't clipped.
            <li key={link.href} className="-m-2 overflow-hidden p-2">
              <div data-menu-link>
                <div className="menu-item flex items-start gap-4 transition-[opacity,translate] duration-(--duration-micro) ease-out motion-safe:has-[a:hover]:translate-x-4 motion-safe:has-[a:focus-visible]:translate-x-4 md:gap-6">
                  <span aria-hidden="true" className="mono pt-[0.5em] text-brass">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Link
                    href={link.href}
                    onClick={(e) => handleClick(e, link.href)}
                    className="group/link h1 flex items-center gap-4 text-snow md:gap-6"
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className="size-[7px] shrink-0 scale-0 rounded-full bg-ember opacity-0 transition-[scale,opacity] duration-(--duration-micro) ease-out group-hover/link:scale-100 group-hover/link:opacity-100 group-focus-visible/link:scale-100 group-focus-visible/link:opacity-100 motion-reduce:scale-100"
                    />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <ul data-menu-fade className="flex shrink-0 flex-wrap gap-x-8 gap-y-4 pb-10 md:pb-12">
          {socialLinks.map((social) => (
            <li key={social.label}>
              <TextLink
                href={social.href}
                className="mono"
                {...(social.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {social.label}
              </TextLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
