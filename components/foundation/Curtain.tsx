"use client";

import { useImperativeHandle, useRef, type Ref } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { duration, ease, stagger } from "@/lib/motion";

const LAYER_DURATION = 0.95; // s, each layer rising in or leaving
const LAYER_OFFSET = 0.12; // s, iron trails slate on the way in, slate trails iron on the way out
const LAYER_TRAVEL = 110; // yPercent, far enough that the cap clears the viewport too
const PAGE_EXIT = { y: -70, scale: 0.95, duration: 1 };
const LABEL_IN_AT = 0.75;
const LABEL_RISE = 16; // px
const LINE_IN_AT = 0.8;
const LINE_IN_DURATION = 1;
const TITLE_IN_AT = 0.85;
const TITLE_IN_DURATION = 1.1;
const TITLE_IN_STAGGER = 0.04;
const CARD_HOLD = 0.35;
const COVERED_HOLD = 0.3; // s, without a card the screen rests covered briefly so in and out read as one transition
const CARD_OUT_DURATION = 0.55;
const EXIT_EASE = "power3.in";
const ENTRANCE_LEAD = 0.6; // s, the new page starts its entrance this long before the curtain is gone

export type ChapterCard = { chapter?: string; title?: string };

export type CurtainHandle = {
  /** Plays the curtain in over `page`. `covered` resolves once the screen is fully covered,
   *  `settled` once the chapter card, or the brief covered hold without one, has finished. */
  enter: (page: HTMLElement | null, card?: ChapterCard) => { covered: Promise<void>; settled: Promise<void> };
  /** Plays the curtain out. Calls `onEntrance` ENTRANCE_LEAD before it's gone. */
  leave: (onEntrance: () => void) => Promise<void>;
};

// Page transition curtain: a slate layer under an iron one. The curved leading and trailing edges are
// separate ellipse caps animated with scaleY only (never border-radius). The iron layer carries the
// optional chapter card. TransitionProvider drives it through the handle.
export function Curtain({ ref }: { ref: Ref<CurtainHandle> }) {
  const root = useRef<HTMLDivElement>(null);
  const slate = useRef<HTMLDivElement>(null);
  const iron = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLParagraphElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const split = useRef<SplitText | null>(null);
  const hasCard = useRef(false);

  const { contextSafe } = useGSAP({ scope: root });

  const caps = (layer: HTMLElement | null, edge: "top" | "bottom") =>
    layer?.querySelector<HTMLElement>(`[data-cap="${edge}"]`) ?? null;

  useImperativeHandle(ref, () => ({
    enter: contextSafe((page: HTMLElement | null, card?: ChapterCard) => {
      let resolveCovered!: () => void;
      let resolveSettled!: () => void;
      const covered = new Promise<void>((r) => (resolveCovered = r));
      const settled = new Promise<void>((r) => (resolveSettled = r));

      const layers = [slate.current, iron.current];
      gsap.set(root.current, { autoAlpha: 1 });
      gsap.set(layers, { yPercent: LAYER_TRAVEL });
      gsap.set([caps(slate.current, "top"), caps(iron.current, "top")], { scaleY: 1 });
      gsap.set([caps(slate.current, "bottom"), caps(iron.current, "bottom")], { scaleY: 0 });

      // Chapter card content is written straight to the DOM; these nodes have no React children.
      label.current!.textContent = card?.chapter ?? "";
      title.current!.textContent = card?.title ?? "";
      hasCard.current = Boolean(card?.chapter || card?.title);
      gsap.set([label.current, line.current], { autoAlpha: 0 });
      split.current?.revert();
      split.current = card?.title ? SplitText.create(title.current, { type: "words,chars", mask: "chars" }) : null;

      const tl = gsap.timeline();
      if (page) {
        // Scale around the middle of what's on screen, not the middle of the whole page.
        gsap.set(page, { transformOrigin: `50% ${window.scrollY + window.innerHeight / 2}px` });
        tl.to(page, { y: PAGE_EXIT.y, scale: PAGE_EXIT.scale, autoAlpha: 0, duration: PAGE_EXIT.duration, ease: ease.inOut }, 0);
      }
      layers.forEach((layer, i) => {
        const at = i * LAYER_OFFSET;
        tl.to(layer, { yPercent: 0, duration: LAYER_DURATION, ease: ease.inOut }, at);
        tl.to(caps(layer, "top"), { scaleY: 0, duration: LAYER_DURATION, ease: ease.inOut }, at);
      });
      tl.call(resolveCovered, [], LAYER_OFFSET + LAYER_DURATION);

      if (card?.chapter) {
        tl.fromTo(
          label.current,
          { autoAlpha: 0, y: LABEL_RISE },
          { autoAlpha: 1, y: 0, duration: duration.base, ease: ease.out },
          LABEL_IN_AT,
        );
      }
      if (hasCard.current) {
        tl.set(line.current, { autoAlpha: 1, transformOrigin: "left center" }, LINE_IN_AT).fromTo(
          line.current,
          { scaleX: 0 },
          { scaleX: 1, duration: LINE_IN_DURATION, ease: ease.out },
          LINE_IN_AT,
        );
      }
      if (split.current) {
        tl.fromTo(
          split.current.chars,
          { yPercent: LAYER_TRAVEL },
          { yPercent: 0, duration: TITLE_IN_DURATION, ease: ease.out, stagger: { each: TITLE_IN_STAGGER, from: "center" } },
          TITLE_IN_AT,
        );
      }
      tl.call(resolveSettled, [], tl.duration() + (hasCard.current ? CARD_HOLD : COVERED_HOLD));

      return { covered, settled };
    }),

    leave: contextSafe(
      (onEntrance: () => void) =>
        new Promise<void>((resolve) => {
          const tl = gsap.timeline({
            onComplete: () => {
              gsap.set(root.current, { autoAlpha: 0 });
              split.current?.revert();
              split.current = null;
              resolve();
            },
          });

          if (hasCard.current) {
            const out = { duration: CARD_OUT_DURATION, ease: EXIT_EASE };
            if (split.current) {
              tl.to(split.current.chars, { yPercent: -LAYER_TRAVEL, stagger: { each: stagger.chars, from: "center" }, ...out }, 0);
            }
            tl.set(line.current, { transformOrigin: "right center" }, 0)
              .to(line.current, { scaleX: 0, ...out }, 0)
              .to(label.current, { autoAlpha: 0, y: -LABEL_RISE, ...out }, 0);
          }

          const layersAt = tl.duration();
          [iron.current, slate.current].forEach((layer, i) => {
            const at = layersAt + i * LAYER_OFFSET;
            tl.to(layer, { yPercent: -LAYER_TRAVEL, duration: LAYER_DURATION, ease: ease.inOut }, at);
            tl.to(caps(layer, "bottom"), { scaleY: 1, duration: LAYER_DURATION, ease: ease.inOut }, at);
          });
          tl.call(onEntrance, [], tl.duration() - ENTRANCE_LEAD);
        }),
    ),
  }));

  return (
    <div ref={root} aria-hidden="true" className="invisible fixed inset-0 z-95 overflow-hidden">
      <div ref={slate} className="absolute inset-0 bg-slate">
        <span data-cap="top" className="curtain-cap top-0 bg-slate" />
        <span data-cap="bottom" className="curtain-cap top-full bg-slate" />
      </div>
      <div ref={iron} className="absolute inset-0 bg-iron">
        <span data-cap="top" className="curtain-cap top-0 bg-iron" />
        <span data-cap="bottom" className="curtain-cap top-full bg-iron" />
        <div className="container-site relative flex h-full flex-col items-center justify-center gap-6 text-center md:gap-8">
          <p ref={label} className="mono text-brass" />
          <div ref={title} className="h1 text-snow" />
          <span ref={line} className="block h-px w-35 bg-brass" />
        </div>
      </div>
    </div>
  );
}
