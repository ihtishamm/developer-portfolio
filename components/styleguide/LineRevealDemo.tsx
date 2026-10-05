"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { duration, ease, fullMotionQuery, reducedMotionQuery, stagger } from "@/lib/motion";
import { Button } from "@/components/ui/Button";

export function LineRevealDemo() {
  const scope = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const reveal = useRef<gsap.core.Animation | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add({ full: fullMotionQuery, reduce: reducedMotionQuery }, (ctx) => {
        const { reduce } = ctx.conditions as { full: boolean; reduce: boolean };
        const el = headline.current;
        if (!el) return;

        // Reduced motion: [data-reveal] is already visible via CSS. Replay is a 0.4s fade.
        if (reduce) {
          gsap.set(el, { autoAlpha: 1 });
          reveal.current = gsap.fromTo(
            el,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: duration.fade, ease: ease.linear, paused: true, immediateRender: false },
          );
          return;
        }

        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit(self) {
            reveal.current = gsap.from(self.lines, {
              yPercent: 110,
              duration: duration.reveal,
              ease: ease.out,
              stagger: stagger.lines,
              scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
            });
            // Lines are now parked below their masks, so the headline can be shown.
            gsap.set(el, { autoAlpha: 1 });
            return reveal.current;
          },
        });
      });
    },
    { scope },
  );

  return (
    <div ref={scope} className="flex flex-col gap-10">
      <h2 ref={headline} data-reveal className="h1 max-w-[14ch]">
        Steel is drawn slowly, and held in the cold.
      </h2>
      <div className="flex flex-wrap items-center gap-6">
        <Button onClick={() => reveal.current?.restart()}>Replay</Button>
        <p className="mono text-steel">1.2s · expo.out · 0.08s stagger · yPercent 110</p>
      </div>
    </div>
  );
}
