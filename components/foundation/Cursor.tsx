"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { duration, ease, finePointerMotionQuery } from "@/lib/motion";

// Brass sparks thrown off by fast pointer movement.
const SPARKS_ENABLED = true;
const SPARK_POOL_SIZE = 24;
const SPARK_SPEED_THRESHOLD = 14; // px per frame (normalised to 60fps)
const SPARK_INTERVAL_MS = 35;
const SPARK_RISE = [20, 65] as const; // px
const SPARK_DRIFT = 18; // max sideways px either way
const SPARK_LIFE = [0.7, 1.2] as const; // s

const DOT_FOLLOW = 0.08; // s, quickTo duration
const RING_LERP = 0.15; // per frame at 60fps
const STRETCH_LERP = 0.2;
const STRETCH_DIVISOR = 50;
const STRETCH_MAX = 0.55;
const STATE_DURATION = 0.5; // s, ring grow/shrink between states
const VIEW_SCALE = 88 / 40; // ring grows from 40px to 88px

type CursorState = "default" | "view" | "hide";

function readState(target: EventTarget | Element | null): CursorState {
  if (!(target instanceof Element)) return "default";
  const value = target.closest("[data-cursor]")?.getAttribute("data-cursor");
  return value === "view" || value === "hide" ? value : "default";
}

// Custom cursor: ember dot, steel ring with velocity stretch, contextual states via [data-cursor].
// Only runs on fine pointers with motion allowed; elsewhere it's display:none (see .cursor in globals.css)
// and the native cursor stays.
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const stretch = useRef<HTMLDivElement>(null);
  const circle = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const sparks = useRef<HTMLSpanElement[]>([]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(finePointerMotionQuery, () => {
        const html = document.documentElement;
        html.classList.add("has-custom-cursor");

        const pointer = { x: 0, y: 0 };
        const lastPointer = { x: 0, y: 0 };
        const ringPos = { x: 0, y: 0 };
        let stretchX = 1;
        let angle = 0;
        let state: CursorState = "default";
        let visible = false;
        let lastSpark = 0;
        let sparkIndex = 0;

        gsap.set([ring.current, dot.current, ...sparks.current], { xPercent: -50, yPercent: -50 });
        gsap.set(root.current, { autoAlpha: 0 });

        const dotX = gsap.quickTo(dot.current, "x", { duration: DOT_FOLLOW, ease: ease.out });
        const dotY = gsap.quickTo(dot.current, "y", { duration: DOT_FOLLOW, ease: ease.out });
        const setRingX = gsap.quickSetter(ring.current, "x", "px");
        const setRingY = gsap.quickSetter(ring.current, "y", "px");
        const setRotation = gsap.quickSetter(stretch.current, "rotation", "deg");
        const setScaleX = gsap.quickSetter(stretch.current, "scaleX");
        const setScaleY = gsap.quickSetter(stretch.current, "scaleY");

        const show = (on: boolean) => {
          if (visible === on) return;
          visible = on;
          gsap.to(root.current, { autoAlpha: on ? 1 : 0, duration: duration.micro, ease: ease.out, overwrite: true });
        };

        const applyState = (next: CursorState) => {
          if (next === state) return;
          state = next;
          const view = next === "view";
          const hide = next === "hide";
          const tween = { duration: STATE_DURATION, ease: ease.out, overwrite: "auto" as const };
          gsap.to(circle.current, { scale: view ? VIEW_SCALE : 1, ...tween });
          gsap.to(fill.current, { opacity: view ? 1 : 0, ...tween });
          gsap.to(label.current, { opacity: view ? 1 : 0, ...tween });
          gsap.to(dot.current, { scale: view ? 0 : 1, ...tween });
          gsap.to([ring.current, dot.current], { opacity: hide ? 0 : 1, ...tween });
        };

        const emitSpark = () => {
          const node = sparks.current[sparkIndex];
          sparkIndex = (sparkIndex + 1) % sparks.current.length;
          const life = gsap.utils.random(SPARK_LIFE[0], SPARK_LIFE[1]);
          gsap.killTweensOf(node);
          gsap.set(node, { x: pointer.x, y: pointer.y, opacity: 1 });
          gsap.to(node, {
            x: pointer.x + gsap.utils.random(-SPARK_DRIFT, SPARK_DRIFT),
            y: pointer.y - gsap.utils.random(SPARK_RISE[0], SPARK_RISE[1]),
            duration: life,
            ease: ease.out,
          });
          gsap.to(node, { opacity: 0, duration: life, ease: ease.linear });
        };

        const onMove = (e: PointerEvent) => {
          if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
          pointer.x = e.clientX;
          pointer.y = e.clientY;
          if (!visible) {
            // First move (or re-entry): snap everything to the pointer instead of flying in.
            ringPos.x = lastPointer.x = pointer.x;
            ringPos.y = lastPointer.y = pointer.y;
            gsap.set(dot.current, { x: pointer.x, y: pointer.y });
            setRingX(ringPos.x);
            setRingY(ringPos.y);
            applyState(readState(e.target));
            show(true);
          }
          dotX(pointer.x);
          dotY(pointer.y);
        };

        const onOver = (e: PointerEvent) => applyState(readState(e.target));
        // Content can scroll under a still pointer, so re-read the hovered element.
        const onScroll = () => {
          if (visible) applyState(readState(document.elementFromPoint(pointer.x, pointer.y)));
        };
        const onLeave = () => show(false);

        const tick = () => {
          const dr = gsap.ticker.deltaRatio();

          const ringLerp = 1 - Math.pow(1 - RING_LERP, dr);
          const dx = (pointer.x - ringPos.x) * ringLerp;
          const dy = (pointer.y - ringPos.y) * ringLerp;
          ringPos.x += dx;
          ringPos.y += dy;
          setRingX(ringPos.x);
          setRingY(ringPos.y);

          const ringSpeed = Math.hypot(dx, dy) / dr;
          if (ringSpeed > 0.1) angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          const target = state === "default" ? 1 + Math.min(ringSpeed / STRETCH_DIVISOR, STRETCH_MAX) : 1;
          stretchX += (target - stretchX) * (1 - Math.pow(1 - STRETCH_LERP, dr));
          setRotation(angle);
          setScaleX(stretchX);
          setScaleY(1 / stretchX);

          if (SPARKS_ENABLED && visible && state !== "hide") {
            const pointerSpeed = Math.hypot(pointer.x - lastPointer.x, pointer.y - lastPointer.y) / dr;
            const now = performance.now();
            if (pointerSpeed > SPARK_SPEED_THRESHOLD && now - lastSpark >= SPARK_INTERVAL_MS) {
              lastSpark = now;
              emitSpark();
            }
          }
          lastPointer.x = pointer.x;
          lastPointer.y = pointer.y;
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("pointerover", onOver, { passive: true });
        window.addEventListener("scroll", onScroll, { passive: true });
        html.addEventListener("mouseleave", onLeave);
        gsap.ticker.add(tick);

        return () => {
          gsap.ticker.remove(tick);
          window.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerover", onOver);
          window.removeEventListener("scroll", onScroll);
          html.removeEventListener("mouseleave", onLeave);
          html.classList.remove("has-custom-cursor");
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden="true" className="cursor pointer-events-none fixed inset-0 z-110">
      {SPARKS_ENABLED &&
        Array.from({ length: SPARK_POOL_SIZE }, (_, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) sparks.current[i] = el;
            }}
            className="absolute top-0 left-0 size-0.5 rounded-full bg-brass opacity-0"
          />
        ))}
      <div ref={ring} className="absolute top-0 left-0">
        <div ref={stretch} className="size-10">
          <div ref={circle} className="relative size-full rounded-full border border-steel">
            <div ref={fill} className="absolute -inset-px rounded-full bg-ember opacity-0" />
          </div>
        </div>
        <span ref={label} className="mono absolute inset-0 flex items-center justify-center text-void opacity-0">
          VIEW
        </span>
      </div>
      <div ref={dot} className="absolute top-0 left-0 size-1.5 rounded-full bg-ember" />
    </div>
  );
}
