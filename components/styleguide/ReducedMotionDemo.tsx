"use client";

import { useRef, useSyncExternalStore } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { duration, ease, reducedMotionQuery } from "@/lib/motion";
import { Button } from "@/components/ui/Button";

const rules = [
  "No preloader",
  "No parallax",
  "No scrub — scroll scenes show their end state",
  "No smooth scroll (Lenis off)",
  "Grain holds still",
  "[data-reveal] content is visible immediately",
  "User-triggered changes use a 0.4s opacity fade, nothing moves",
];

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function ReducedMotionDemo() {
  const scope = useRef<HTMLDivElement>(null);
  const prefersReduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => null,
  );

  const { contextSafe } = useGSAP({ scope });
  const playFade = contextSafe(() => {
    gsap.fromTo(
      "[data-fade-sample]",
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.fade, ease: ease.linear, overwrite: true },
    );
  });

  const status = prefersReduced === null ? "Detecting…" : prefersReduced ? "On" : "Off";

  return (
    <div ref={scope} className="grid grid-cols-4 gap-x-6 gap-y-10 border border-slate bg-iron p-6 md:p-10 lg:grid-cols-12">
      <div className="col-span-4 flex flex-col gap-6 lg:col-span-5">
        <p className="label text-steel">
          Your system setting: <span className="text-snow">{status}</span>
        </p>
        <ul className="flex flex-col gap-3 small text-mist">
          {rules.map((rule) => (
            <li key={rule} className="flex gap-3">
              <span aria-hidden="true" className="text-brass">—</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-4 flex flex-col items-start gap-8 border-t border-slate pt-10 lg:col-span-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
        <p data-fade-sample className="h2">
          The reduced reveal.
        </p>
        <Button onClick={playFade}>Play fade</Button>
      </div>
    </div>
  );
}
