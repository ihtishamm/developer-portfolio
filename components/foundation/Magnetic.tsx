"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ease, finePointerMotionQuery } from "@/lib/motion";

const OUTER_PULL = { x: 0.35, y: 0.45 };
const INNER_PULL = { x: 0.18, y: 0.22 };
const FOLLOW_DURATION = 0.6; // s
const RETURN_DURATION = 0.9; // s

type MagneticProps = {
  children: ReactNode;
  className?: string;
};

// Pulls its child toward the pointer in two layers (outer + inner) for depth.
// Hides the custom cursor while hovered. Inert on coarse pointers and under reduced motion.
export function Magnetic({ children, className = "" }: MagneticProps) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(finePointerMotionQuery, () => {
        const el = outer.current!;
        // Plain overwrite tweens rather than quickTo, so the leave tween can cleanly take over.
        const follow = { duration: FOLLOW_DURATION, ease: ease.out, overwrite: true };

        const onMove = (e: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          // Offset from the element's resting centre, so the pull doesn't feed back on itself.
          const restX = rect.left - (gsap.getProperty(el, "x") as number) + rect.width / 2;
          const restY = rect.top - (gsap.getProperty(el, "y") as number) + rect.height / 2;
          const dx = e.clientX - restX;
          const dy = e.clientY - restY;
          gsap.to(el, { x: dx * OUTER_PULL.x, y: dy * OUTER_PULL.y, ...follow });
          gsap.to(inner.current, { x: dx * INNER_PULL.x, y: dy * INNER_PULL.y, ...follow });
        };

        const onLeave = () => {
          gsap.to([el, inner.current], { x: 0, y: 0, duration: RETURN_DURATION, ease: ease.out, overwrite: true });
        };

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        };
      });
      return () => mm.revert();
    },
    { scope: outer },
  );

  return (
    <div ref={outer} data-cursor="hide" className={`inline-flex ${className}`}>
      <div ref={inner} className="inline-flex">
        {children}
      </div>
    </div>
  );
}
