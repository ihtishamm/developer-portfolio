"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { Flip, gsap, SplitText, useGSAP } from "@/lib/gsap";
import { duration, ease, preloader as t, reducedMotionQuery, stagger } from "@/lib/motion";
import { hasSeenPreloader, PRELOADER_DONE_EVENT, PRELOADER_SEEN_KEY } from "@/lib/preloader";
import { ENEMIES, ENEMY_HORDE } from "@/lib/site";
import { useSmoothScroll } from "@/components/foundation/SmoothScroll";
import { EnemyWord } from "./EnemyWord";
import { FogLayer } from "./FogLayer";
import { createParticles } from "./particles";

const NAME = ["IHTISHAM", "HASSAN"];
const TAGLINE = "Frontend engineer, Lahore";
const mobileQuery = "(max-width: 767px)";
const MOBILE_HORDE = 4; // mobile charges with 8 words: 4 of the horde plus ENEMIES

// Key art size (plain and figure versions are the same frame), for placing the vanishing point.
const ART = { width: 2560, height: 1429 };

// Sword art geometry, as percentages of the shared 628px canvas both images sit on.
const SHEATHED_X = -25.5; // sword offset from the sheath that puts the crossguard against its throat
const POMMEL = 0.8; // the pommel's outer edge
const BLADE = 71.7; // crossguard to tip
const GUARD = 27.4; // the crossguard's blade side
const TIP = 99;
const SHEATH_END = 99;
const SWORD_LENGTH = 98.2; // pommel to tip
const GLINT = 0.15 * BLADE; // the glint streak, 15% of the blade
const CLIP = 5000; // px, half-plane size for the cut polygons

const pad = (value: number) => String(Math.round(value * 100)).padStart(3, "0");

// Small seeded PRNG: the horde scatters the same way every time, so the composition stays designed.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Anchored to the top of the camera and taller than it, so the lone figure stands in the lower third.
function KeyArt({ figure }: { figure?: boolean }) {
  return (
    <Image
      data-preload-asset
      src={`/images/preloader/${figure ? "key-art-figure" : "key-art"}-desktop.webp`}
      alt=""
      {...ART}
      unoptimized
      loading="eager"
      fetchPriority={figure ? "low" : "high"}
      className="absolute inset-x-0 top-0 w-full object-cover object-top"
      style={{ height: `${t.keyArtHeight * 100}%`, filter: `brightness(${t.keyArtBrightness})` }}
    />
  );
}

// "The Lone Stand": the battlefield in snow and fog, a sword drawn as the site loads, a horde of enemy
// words charging out of the horizon, a hard stop, one whip of the sword in slow motion, then the lone
// figure and the name, which flies into the hero title (data-flip-id="hero-name") as the screen lifts.
// Server-rendered as a fixed void layer so nothing flashes before it. Runs once per session; the head
// script in the root layout and CSS hide it on repeat visits and under reduced motion.
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const skipRef = useRef<() => void>(() => {});
  const { stop, start } = useSmoothScroll();

  // The head script marks repeat visits before paint, but React clears attributes on <html> when it
  // remounts in development. Reapply before paint; a no-op in production.
  useLayoutEffect(() => {
    if (hasSeenPreloader() || window.matchMedia(reducedMotionQuery).matches) {
      document.documentElement.setAttribute("data-preloader", "skip");
    }
  }, []);

  useGSAP(
    (_, contextSafe) => {
      const html = document.documentElement;
      if (html.hasAttribute("data-preloader")) return;

      const q = gsap.utils.selector(root);
      const one = (selector: string) => q(selector)[0] as HTMLElement;
      const panel = one("[data-panel]");
      const cap = one("[data-cap]");
      const camera = one("[data-camera]");
      const keyArt = one("[data-key-art]");
      const figure = one("[data-figure]");
      const rig = one("[data-sword-rig]");
      const ghosts = q("[data-ghost]");
      const group = one("[data-sword-group]");
      const lightLine = one("[data-light-line]");
      const blade = one("[data-sword]");
      const sheath = one("[data-sheath]");
      const tip = one("[data-tip]");
      const glint = one("[data-glint]");
      const counter = one("[data-counter]");
      const flash = one("[data-flash]");
      const slash = one("[data-slash]") as unknown as HTMLCanvasElement;
      const skip = one("[data-skip]");
      const name = one("[data-name]");
      const nameLine = one("[data-name-line]");
      const tagline = one("[data-tagline]");
      const nameWords = q("[data-name-word]");
      const enemies = q("[data-enemy]");
      const trembles = q("[data-tremble]");
      const fog = { back: one('[data-fog="back"]'), mid: one('[data-fog="mid"]'), front: one('[data-fog="front"]') };
      const site = document.querySelector<HTMLElement>("[data-site]");
      const mobile = window.matchMedia(mobileQuery).matches;
      const horde = q("[data-horde]").slice(0, mobile ? MOBILE_HORDE : undefined);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const diagonal = Math.hypot(vw, vh);

      // While running: scroll frozen, the page and nav out of reach, the custom cursor still live.
      // CSS locks scroll from the first paint. Lenis is created by SmoothScroll's effect, which runs
      // after this child's, so stop it once the commit is done (or stop() would miss it).
      queueMicrotask(stop);
      site?.setAttribute("inert", "");
      gsap.set(cap, { scaleY: 0 });

      // The vanishing point: the key art's horizon glow, in camera coordinates from its centre (the
      // camera is centred on the screen; the art is object-cover in a top-anchored box keyArtHeight tall).
      const [fx, fy] = t.vanishingPoint;
      const box = { width: camera.offsetWidth, height: camera.offsetHeight * t.keyArtHeight };
      const cover = Math.max(box.width / ART.width, box.height / ART.height);
      const clampX = gsap.utils.clamp((t.vanishingClamp.min - 0.5) * vw, (t.vanishingClamp.max - 0.5) * vw);
      const vanish = {
        x: clampX((fx - 0.5) * ART.width * cover),
        y: fy * ART.height * cover - camera.offsetHeight / 2,
      };

      // Snow and ash, from the first frame.
      const particles = createParticles(
        one("[data-particles]") as unknown as HTMLCanvasElement,
        { x: vanish.x + camera.offsetWidth / 2, y: vanish.y + camera.offsetHeight / 2 },
        mobile,
      );

      // Fog drifts from the first frame; each layer fades in once its image has decoded.
      const drifts = (["back", "mid", "front"] as const).map((layer) =>
        gsap.to(fog[layer].querySelector("[data-fog-strip]"), {
          xPercent: -200 / 3,
          duration: t.fogLoop[layer],
          ease: ease.linear,
          repeat: -1,
        }),
      );

      // Real loading progress: fonts plus decoding of every preloader image.
      const assets = q("[data-preload-asset]") as HTMLImageElement[];
      const tasks: Promise<unknown>[] = [
        document.fonts.ready,
        ...assets.map((img) =>
          img
            .decode()
            .catch(() => {})
            .then(
              contextSafe!(() => {
                const strip = img.closest("[data-fog]")?.querySelector("[data-fog-strip]");
                if (strip) gsap.fromTo(strip, { autoAlpha: 0 }, { autoAlpha: 1, duration: duration.base, ease: ease.linear });
              }),
            ),
        ),
      ];
      let loaded = 0;
      let real = 0;
      tasks.forEach((task) => task.then(() => (real = ++loaded / tasks.length)));
      const timeout = gsap.delayedCall(t.timeout, () => (real = 1));

      // Name: letters rise from masks, centre out. Split on first use, once fonts have loaded.
      let split: SplitText | null = null;
      const chars = () => (split ??= SplitText.create(nameWords, { type: "chars", mask: "chars" })).chars;

      // Opening: the key art fades up from black, the camera pushes in for the whole intro, a light line
      // flashes where the sword will be (and is gone), then the sword and sheath fade in and the draw starts.
      // Framing, as xPercent of the canvas (the rig is centred): the draw ends with the pommel at pommelAt.
      // The sword travels `share` of the blade's length left, the sheath the rest right.
      const share = mobile ? t.drawShare.mobile : t.drawShare.desktop;
      const rigLeft = (vw - rig.offsetWidth) / 2;
      const swordTo = ((t.pommelAt * vw - rigLeft) / rig.offsetWidth) * 100 - POMMEL;
      const swordFrom = swordTo + BLADE * share;
      const sheathFrom = swordFrom - SHEATHED_X;
      gsap.set(rig, { rotation: t.swordAngle });
      gsap.set(sheath, { xPercent: sheathFrom });
      gsap.set(blade, { xPercent: swordFrom });
      gsap.set(q("[data-ghost-sword]"), { xPercent: swordTo });
      // The light line spans the sheathed sword, pommel to chape.
      gsap.set(lightLine, { left: `${swordFrom + POMMEL}%`, width: `${sheathFrom + SHEATH_END - swordFrom - POMMEL}%` });
      // Words wait at the vanishing point. Pre-warm: they are painted once, invisibly, during the draw,
      // so the charge doesn't stall on rasterizing a dozen text layers in its first frames.
      gsap.set([...horde, ...enemies], {
        xPercent: -50,
        yPercent: -50,
        x: vanish.x,
        y: vanish.y,
        scale: t.hordeScale.from,
        autoAlpha: t.prewarmOpacity,
      });
      gsap.fromTo(keyArt, { autoAlpha: 0 }, { autoAlpha: 1, duration: t.keyArtFadeDuration, ease: "sine.inOut" });
      const zoom = gsap.to(camera, { scale: t.cameraZoom, duration: t.cameraDuration, ease: ease.linear });

      const intro = gsap.timeline({ delay: t.introAt });
      intro
        .set(lightLine, { autoAlpha: 1 })
        .fromTo(lightLine, { scaleX: 0 }, { scaleX: 1, duration: t.lightLineIn, ease: ease.out })
        .to(lightLine, { autoAlpha: 0, duration: t.lightLineOut, ease: ease.linear })
        .fromTo(
          [group, counter],
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: t.swordInDuration, ease: ease.out },
          t.drawAt - t.introAt,
        );

      // The draw: the counter follows an eased minDraw curve, held back by real progress (which it eases
      // toward) when loading is slower. The sheath is pulled right, the sword slides left, and the counter
      // rides under the pommel.
      const drawEase = gsap.parseEase(t.drawEase);
      let chased = 0;
      let shown = 0;
      let drawStart = -1;
      let exiting = false;
      let battle: gsap.core.Timeline | null = null;
      let slow: gsap.core.Timeline | null = null; // the slow-motion split, separate from the battle
      const setBlade = gsap.quickSetter(blade, "xPercent");
      const setSheath = gsap.quickSetter(sheath, "xPercent");
      const tick = (time: number, deltaTime: number) => {
        if (drawStart < 0) drawStart = time;
        chased += (real - chased) * (1 - Math.exp((-t.progressRate * deltaTime) / 1000));
        if (real === 1 && chased > 0.995) chased = 1;
        shown = Math.min(chased, drawEase(Math.min(1, (time - drawStart) / t.minDraw)));

        setBlade(swordFrom - BLADE * share * shown);
        setSheath(sheathFrom + BLADE * (1 - share) * shown);
        counter.textContent = pad(shown);

        if (shown === 1) {
          gsap.ticker.remove(tick);
          battle = buildBattle();
        }
      };
      const startDraw = gsap.delayedCall(t.drawAt, () => {
        gsap.ticker.add(tick);
      });

      // Camera shake during the charge, and the ENEMIES' tremble before the stop: random offsets each frame.
      const shake = { amp: 0 };
      const setCameraX = gsap.quickSetter(camera, "x", "px");
      const setCameraY = gsap.quickSetter(camera, "y", "px");
      const shakeTick = () => {
        setCameraX(gsap.utils.random(-shake.amp, shake.amp));
        setCameraY(gsap.utils.random(-shake.amp, shake.amp));
      };
      const trembleTick = () => {
        trembles.forEach((el) => gsap.set(el, { x: gsap.utils.random(-t.tremble, t.tremble), y: gsap.utils.random(-t.tremble, t.tremble) }));
      };
      const stopShake = () => {
        gsap.ticker.remove(shakeTick);
        gsap.ticker.remove(trembleTick);
        setCameraX(0);
        setCameraY(0);
        gsap.set(trembles, { x: 0, y: 0 });
      };

      // The cut, worked out at the moment of the slash: the line through the blade tip at the slash angle,
      // in screen space. Each ENEMY is clipped into two halves along it, in its own coordinates; a word the
      // line misses is cut along the same angle through its own centre.
      const angle = (t.slashAngle * Math.PI) / 180;
      const along = { x: Math.cos(angle), y: Math.sin(angle) }; // up and to the right
      const across = { x: along.y, y: -along.x }; // perpendicular, toward the top half
      const parts = new Map<Element, { x: number; y: number; rotation: number }>();
      let origin = { x: 0, y: 0 };
      const reach = { forward: 0, back: 0 }; // px from the tip to the screen edge, each way along the cut
      const edge = (from: { x: number; y: number }, dir: { x: number; y: number }) =>
        Math.min(
          dir.x > 0 ? (vw - from.x) / dir.x : dir.x < 0 ? -from.x / dir.x : Infinity,
          dir.y > 0 ? (vh - from.y) / dir.y : dir.y < 0 ? -from.y / dir.y : Infinity,
        );
      const cut = () => {
        const tipRect = tip.getBoundingClientRect();
        origin = { x: tipRect.left, y: tipRect.top };
        reach.forward = edge(origin, along);
        reach.back = edge(origin, { x: -along.x, y: -along.y });
        const plane = (side: 1 | -1, p: { x: number; y: number }) => {
          const a = { x: p.x - along.x * CLIP, y: p.y - along.y * CLIP };
          const b = { x: p.x + along.x * CLIP, y: p.y + along.y * CLIP };
          const off = { x: across.x * CLIP * side, y: across.y * CLIP * side };
          return `polygon(${a.x}px ${a.y}px, ${b.x}px ${b.y}px, ${b.x + off.x}px ${b.y + off.y}px, ${a.x + off.x}px ${a.y + off.y}px)`;
        };
        const random = seeded(11);
        const between = ({ min, max }: { min: number; max: number }) => min + (max - min) * random();
        const side = (x: number, y: number) => Math.sign((x - origin.x) * along.y - (y - origin.y) * along.x);
        enemies.forEach((word) => {
          const rect = word.getBoundingClientRect();
          const scale = rect.width / (word as HTMLElement).offsetWidth; // word scale x camera scale
          const corners = [side(rect.left, rect.top), side(rect.right, rect.top), side(rect.left, rect.bottom), side(rect.right, rect.bottom)];
          const crossed = corners.some((c) => c !== corners[0]);
          const through = crossed ? origin : { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
          const local = { x: (through.x - rect.left) / scale, y: (through.y - rect.top) / scale };
          const [a, b] = [word.querySelector('[data-half="a"]')!, word.querySelector('[data-half="b"]')!];
          gsap.set(a, { clipPath: plane(1, local) });
          gsap.set(b, { clipPath: plane(-1, local), autoAlpha: 1 });
          const apart = between(t.splitDistance) / 2 / scale; // each half moves half the gap
          const turn = between(t.splitRotation);
          parts.set(a, { x: across.x * apart, y: across.y * apart, rotation: -turn });
          parts.set(b, { x: -across.x * apart, y: -across.y * apart, rotation: turn });
        });
        // One hard kick of the camera.
        gsap.fromTo(
          camera,
          { x: -along.x * t.jolt, y: -along.y * t.jolt },
          { x: 0, y: 0, duration: t.joltDuration, ease: "power3.out" },
        );
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        slash.width = Math.round(vw * ratio);
        slash.height = Math.round(vh * ratio);
        slash.getContext("2d")?.setTransform(ratio, 0, 0, ratio, 0, 0);
        gsap.set(slash, { autoAlpha: 1 });
      };

      // The slash stroke: a long thin diamond (thick in the middle, nothing at the ends), from the tip
      // forward as it travels, and back across the screen at the same pace, so it spans the screen when
      // the swing ends.
      const drawSlash = (front: { x: number; y: number }) => {
        const ctx = slash.getContext("2d");
        if (!ctx) return;
        const travelled = Math.min(1, Math.hypot(front.x - origin.x, front.y - origin.y) / reach.forward);
        const end = { x: origin.x + along.x * reach.forward * travelled, y: origin.y + along.y * reach.forward * travelled };
        const back = { x: origin.x - along.x * reach.back * travelled, y: origin.y - along.y * reach.back * travelled };
        const mid = { x: (end.x + back.x) / 2, y: (end.y + back.y) / 2 };
        const half = t.slashWidth / 2;
        ctx.clearRect(0, 0, vw, vh);
        ctx.fillStyle = getComputedStyle(html).getPropertyValue("--color-snow");
        ctx.beginPath();
        ctx.moveTo(back.x, back.y);
        ctx.lineTo(mid.x + across.x * half, mid.y + across.y * half);
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(mid.x - across.x * half, mid.y - across.y * half);
        ctx.closePath();
        ctx.fill();
      };

      const buildBattle = contextSafe!(() => {
        const tl = gsap.timeline();
        const camScale = () => gsap.getProperty(camera, "scale") as number;

        // 100: a glint streaks along the blade, the counter bows out.
        tl.set(glint, { autoAlpha: 1 }, 0)
          .fromTo(
            glint,
            { xPercent: ((GUARD - GLINT) / GLINT) * 100 },
            { xPercent: (TIP / GLINT) * 100, duration: t.glintDuration, ease: t.glintEase },
            0,
          )
          .set(glint, { autoAlpha: 0 }, t.glintDuration)
          .to(counter, { autoAlpha: 0, duration: t.counterOutDuration, ease: ease.linear }, t.counterOutAt);

        // The charge. The fog and the snow speed up, the camera shakes harder as the horde closes in.
        const chargeAt = t.waveAt[0];
        const charge = t.stopAt - chargeAt;
        tl.to(drifts, { timeScale: t.fogChargeSpeed, duration: charge, ease: "power2.in" }, chargeAt)
          .to(particles.state, { charge: 1, duration: charge, ease: "power2.in" }, chargeAt)
          .fromTo(shake, { amp: 0 }, { amp: mobile ? t.shake.mobile : t.shake.desktop, duration: charge, ease: "power2.in" }, chargeAt)
          .call(() => gsap.ticker.add(shakeTick), [], chargeAt)
          .call(() => gsap.ticker.add(trembleTick), [], t.trembleAt);

        // Waves 1 and 2: the horde comes out of the vanishing point, each word on its own heading, faint and
        // tiny, accelerating at the camera until it passes and leaves the frame.
        const random = seeded(7);
        const between = (min: number, max: number) => min + (max - min) * random();
        const reachOut = diagonal * t.hordeReach;
        horde.forEach((word, i) => {
          const at = t.waveAt[i < horde.length / 2 ? 0 : 1] + between(0, t.waveJitter);
          const span = between(t.hordeDuration.min, t.hordeDuration.max);
          const heading = ((i * 0.618) % 1) * Math.PI * 2; // golden-ratio steps spread each wave all round
          const travel = { duration: span, immediateRender: false };
          tl.fromTo(
            word,
            { x: vanish.x, y: vanish.y, scale: t.hordeScale.from },
            {
              x: vanish.x + Math.cos(heading) * reachOut,
              y: vanish.y + Math.sin(heading) * reachOut,
              scale: t.hordeScale.to,
              ease: t.chargeEase,
              ...travel,
            },
            at,
          )
            .fromTo(word, { autoAlpha: 0 }, { autoAlpha: 1, ease: t.approachEase, ...travel }, at)
            .fromTo(word.querySelector("[data-horde-snow]"), { opacity: 0 }, { opacity: 1, ease: t.approachEase, ...travel }, at)
            .set(word, { autoAlpha: 0 }, at + span);
        });

        // Wave 3: ENEMIES, the same way in, stopping large on the hard stop at their screen positions
        // (converted to camera coordinates at the zoom the camera will have reached by then).
        const zoomAtStop = 1 + (t.cameraZoom - 1) * Math.min(1, (zoom.time() + t.stopAt) / t.cameraDuration);
        const stops = mobile ? t.enemyStops.mobile : t.enemyStops.desktop;
        enemies.forEach((word, i) => {
          const stop = stops[i];
          const travel = { duration: t.enemyDuration, immediateRender: false };
          tl.fromTo(
            word,
            { x: vanish.x, y: vanish.y, scale: t.hordeScale.from },
            {
              x: ((stop.x - 0.5) * vw) / zoomAtStop,
              y: ((stop.y - 0.5) * vh) / zoomAtStop,
              scale: stop.scale,
              ease: t.chargeEase,
              ...travel,
            },
            t.waveAt[2],
          )
            .fromTo(word, { autoAlpha: 0 }, { autoAlpha: 1, ease: t.approachEase, ...travel }, t.waveAt[2])
            .fromTo(word.querySelectorAll("[data-enemy-snow]"), { opacity: 0 }, { opacity: 1, ease: t.approachEase, ...travel }, t.waveAt[2]);
        });

        // Hard stop: shake and tremble cut out, the fog and the snow freeze. Stillness until the slash.
        tl.call(stopShake, [], t.stopAt).set(drifts, { timeScale: 0 }, t.stopAt).set(particles.state, { speed: 0 }, t.stopAt);

        // The slash, in real time. The sword whips along the cut, pivoting on its tip (so the tip runs
        // straight down the line) and leaves the frame within the whip; ghost copies trail it and the
        // stroke trails the tip. A flash, one camera kick, the fog thrown outward, the snow settling.
        let start = { x: 0, y: 0 };
        let whipStart = 0;
        const history: { time: number; x: number; y: number; rotation: number }[] = [];
        const swordLength = () => (rig.offsetWidth * SWORD_LENGTH) / 100; // camera px
        tl.call(cut, [], t.slashAt)
          .set(flash, { autoAlpha: t.flashOpacity }, t.slashAt)
          .set(flash, { autoAlpha: 0 }, t.slashAt + t.flashDuration)
          .set(particles.state, { speed: 1 }, t.slashAt)
          .to(sheath, { autoAlpha: 0, duration: t.flashDuration, ease: ease.linear }, t.slashAt)
          .set(rig, { transformOrigin: () => `${swordTo + TIP}% 50%`, smoothOrigin: true }, t.slashAt)
          .set(ghosts, { transformOrigin: () => `${swordTo + TIP}% 50%` }, t.slashAt)
          .to(
            rig,
            {
              rotation: t.slashAngle,
              x: () => `+=${along.x * (reach.forward / camScale() + swordLength() * t.whipOvershoot)}`,
              y: () => `+=${along.y * (reach.forward / camScale() + swordLength() * t.whipOvershoot)}`,
              duration: t.whipDuration,
              ease: t.whipEase,
              onStart() {
                whipStart = gsap.ticker.time;
                start = { x: gsap.getProperty(rig, "x") as number, y: gsap.getProperty(rig, "y") as number };
              },
              onUpdate() {
                const now = gsap.ticker.time;
                const pose = {
                  time: now,
                  x: gsap.getProperty(rig, "x") as number,
                  y: gsap.getProperty(rig, "y") as number,
                  rotation: gsap.getProperty(rig, "rotation") as number,
                };
                history.push(pose);
                const scale = camScale();
                drawSlash({ x: origin.x + (pose.x - start.x) * scale, y: origin.y + (pose.y - start.y) * scale });
                // Each ghost holds the sword's pose from a moment ago, fading out within ghostFade.
                const fade = Math.max(0, 1 - (now - whipStart) / t.ghostFade);
                ghosts.forEach((ghost, i) => {
                  const then = now - (i + 1) * t.ghostLag;
                  const past = [...history].reverse().find((p) => p.time <= then) ?? history[0];
                  gsap.set(ghost, { x: past.x, y: past.y, rotation: past.rotation, autoAlpha: t.ghostOpacity[i] * fade });
                });
              },
            },
            t.slashAt,
          )
          .set([rig, ...ghosts], { autoAlpha: 0 }, t.slashAt + t.whipDuration)
          // The stroke holds fully bright, then fades.
          .to(slash, { autoAlpha: 0, duration: t.slashFade, ease: ease.linear }, t.slashAt + t.slashHold)
          .to(particles.state, { charge: 0, duration: t.fogSettleDuration, ease: "power2.out" }, t.slashAt);

        // Slow motion, for the word halves and the particles only, on a timeline of their own: the halves
        // part perpendicular to the cut, turn opposite ways and fade.
        const splitAt = t.slashAt + t.splitAt;
        const calmAt = splitAt + t.slowReal;
        tl.call(
          contextSafe!(() => {
            slow = gsap.timeline().to(q("[data-half]"), {
              x: (_i: number, el: Element) => parts.get(el)?.x ?? 0,
              y: (_i: number, el: Element) => parts.get(el)?.y ?? 0,
              rotation: (_i: number, el: Element) => parts.get(el)?.rotation ?? 0,
              autoAlpha: 0,
              duration: t.slowReal * t.slowScale + t.splitTail,
              ease: "power2.out",
            });
            slow.timeScale(t.slowScale);
            particles.state.speed = t.slowScale;
          }),
          [],
          splitAt,
        ).call(
          () => {
            slow?.timeScale(1);
            particles.state.speed = 1;
          },
          [],
          calmAt,
        );
        (["back", "mid", "front"] as const).forEach((layer) => {
          tl.to(fog[layer], { scale: t.fogJolt[layer], duration: t.fogSettleDuration, ease: ease.out }, t.slashAt);
        });
        tl.to(fog.front, { autoAlpha: 0, duration: calmAt - t.slashAt, ease: ease.linear }, t.slashAt).to(
          drifts,
          { timeScale: 1, duration: t.fogSettleDuration, ease: "power2.out" },
          t.slashAt,
        );

        // Calm: the lone figure appears on the battlefield, and the name rises above him, then a brass
        // line draws in under it and the label. Sword, words, slash and front fog are all gone by now.
        const nameAt = calmAt + t.splitTail + t.nameGap;
        tl.fromTo(figure, { autoAlpha: 0 }, { autoAlpha: 1, duration: t.figureFadeDuration, ease: "sine.inOut" }, calmAt)
          .fromTo(
            chars(),
            { yPercent: t.liftTravel },
            { yPercent: 0, duration: duration.reveal, ease: ease.out, stagger: { each: stagger.chars, from: "center" } },
            nameAt,
          )
          .set(nameLine, { autoAlpha: 1 }, nameAt + t.lineDelay)
          .fromTo(nameLine, { scaleX: 0 }, { scaleX: 1, duration: t.lineDuration, ease: ease.out }, nameAt + t.lineDelay)
          .fromTo(tagline, { autoAlpha: 0 }, { autoAlpha: 1, duration: duration.fade, ease: ease.linear }, nameAt + t.taglineDelay)
          .call(exit, [], nameAt + t.exitAfterName);
        // The letters now sit below their masks (fromTo renders its start immediately), so the name can
        // be shown, and painted, long before it rises without anything appearing.
        gsap.set(name, { autoAlpha: 1 });
        return tl;
      });

      // Exit: the fog parts left and right, the screen lifts (flat panel + scaled bottom cap), and the
      // name flies into the hero title. Measured now, so the handoff lands wherever the hero is.
      const exit = contextSafe!(() => {
        if (exiting) return;
        exiting = true;
        // document, not the context's scope: the hero lives outside the preloader.
        const heroWords = [...document.querySelectorAll<HTMLElement>('[data-flip-id="hero-name"] [data-flip-word]')];
        const inView = (el: HTMLElement) => {
          const rect = el.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight;
        };
        const onScreen = heroWords.length === nameWords.length && heroWords.every(inView);

        const tl = gsap.timeline({ onComplete: finish });
        const lift = { duration: t.liftDuration, ease: ease.inOut };
        const part = { autoAlpha: 0, duration: t.fogPartDuration, ease: ease.out };
        // overwrite: the label may still be fading in.
        const fadeOut = { autoAlpha: 0, duration: duration.fade, ease: ease.linear, overwrite: "auto" as const };
        tl.to([skip, tagline, nameLine], fadeOut, 0)
          .to(panel, { yPercent: -t.liftTravel, ...lift }, 0)
          .fromTo(cap, { scaleY: 0 }, { scaleY: 1, ...lift }, 0)
          .to(fog.back, { x: -t.fogPart * vw, ...part }, 0)
          .to(fog.mid, { x: t.fogPart * vw, ...part }, 0);
        if (onScreen) {
          nameWords.forEach((word, i) => {
            const fit = Flip.fit(word, heroWords[i], { scale: true, duration: t.flipDuration, ease: ease.inOut });
            if (fit) tl.add(fit as gsap.core.Tween, 0);
          });
        } else {
          tl.to(name, { autoAlpha: 0, duration: duration.base, ease: ease.linear }, 0);
        }
      });

      // Hands over to the site: the hero title (identical, in the same place) replaces the flown name.
      const finish = () => {
        try {
          sessionStorage.setItem(PRELOADER_SEEN_KEY, "1");
        } catch {}
        drifts.forEach((drift) => drift.kill());
        zoom.kill();
        particles.destroy();
        html.setAttribute("data-preloader", "done");
        site?.removeAttribute("inert");
        start();
        window.dispatchEvent(new Event(PRELOADER_DONE_EVENT));
      };

      // Skip (button or Esc): jump straight to the calm, named screen and play only the exit.
      skipRef.current = contextSafe!(() => {
        if (exiting) return;
        startDraw.kill();
        intro.kill();
        timeout.kill();
        gsap.ticker.remove(tick);
        battle?.kill();
        slow?.kill();
        stopShake();
        drifts.forEach((drift) => drift.timeScale(1));
        Object.assign(particles.state, { charge: 0, speed: 1 });
        gsap.set([rig, ...ghosts, lightLine, glint, counter, flash, slash, fog.front, ...horde, ...enemies], { autoAlpha: 0 });
        gsap.set([figure, name, nameLine, tagline], { autoAlpha: 1 });
        gsap.set(nameLine, { scaleX: 1 });
        gsap.set(chars(), { yPercent: 0 });
        exit();
      });

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") skipRef.current();
      };
      document.addEventListener("keydown", onKeyDown);

      return () => {
        gsap.ticker.remove(tick);
        gsap.ticker.remove(shakeTick);
        gsap.ticker.remove(trembleTick);
        particles.destroy();
        document.removeEventListener("keydown", onKeyDown);
        site?.removeAttribute("inert");
        if (!html.hasAttribute("data-preloader")) start();
      };
    },
    { scope: root },
  );

  const onSkip = () => skipRef.current();
  const art = { width: 628, height: 156, unoptimized: true, loading: "eager", fetchPriority: "high" } as const;

  return (
    <div ref={root} className="preloader">
      <div data-panel aria-hidden="true" className="absolute inset-0 bg-void">
        <div className="absolute inset-0 overflow-hidden">
          {/* The camera: one wrapper that pushes in, shakes and kicks. It overscans the screen (115%) so
              none of that ever shows an edge. Back to front inside it. */}
          <div data-camera className="absolute -inset-[7.5%] will-change-transform">
            <div data-key-art data-reveal className="absolute inset-0">
              <KeyArt />
            </div>
            <div data-figure data-reveal className="absolute inset-0">
              <KeyArt figure />
            </div>
            <FogLayer name="back" className="top-[2%] h-[60%]" />

            {/* Waves 1 and 2, behind fog-mid. Steel, with a snow copy that brightens as they close in. */}
            <div className="absolute inset-0">
              {ENEMY_HORDE.map((word) => (
                <div key={word} className="absolute top-1/2 left-1/2">
                  <span data-horde data-reveal className="h2 relative block whitespace-nowrap text-steel">
                    {word}
                    <span data-horde-snow className="absolute inset-0 text-snow opacity-0">
                      {word}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <FogLayer name="mid" className="top-[28%] h-[55%]" />

            {/* The sword rig holds the angle and makes the whip. The group fades in; inside, the sword (with
                its glint, tip marker and counter) sits behind the sheath on a shared 628x156 canvas, both
                placed by xPercent so the draw ends with the whole sword in frame. Behind it, three ghost
                copies of the sword that trail the whip. */}
            <div className="absolute inset-0 flex items-center justify-center">
              {t.ghostOpacity.map((_, i) => (
                <div key={i} data-ghost className="invisible absolute aspect-628/156 w-[76.8vw] md:w-[68.7vw]">
                  <div data-ghost-sword className="absolute inset-0">
                    <Image src="/images/preloader/sword.webp" alt="" {...art} className="h-auto w-full" />
                  </div>
                </div>
              ))}
              <div data-sword-rig className="relative w-[76.8vw] md:w-[68.7vw]">
                <span data-light-line data-reveal className="absolute top-1/2 h-px bg-snow" />
                <div data-sword-group data-reveal className="relative">
                  <div data-sword className="absolute inset-0">
                    <Image data-preload-asset src="/images/preloader/sword.webp" alt="" {...art} className="h-auto w-full" />
                    {/* Glint: a long, narrow streak screened over the blade, masked to the sword's own shape. */}
                    <div
                      className="absolute inset-0 overflow-hidden mix-blend-screen"
                      style={{
                        maskImage: "url(/images/preloader/sword.webp)",
                        WebkitMaskImage: "url(/images/preloader/sword.webp)",
                        maskSize: "100% 100%",
                        WebkitMaskSize: "100% 100%",
                      }}
                    >
                      <div
                        data-glint
                        data-reveal
                        className="absolute inset-y-0 left-0 bg-linear-to-r from-transparent via-snow to-transparent"
                        style={{ width: `${GLINT}%` }}
                      />
                    </div>
                    <span data-tip className="absolute top-1/2" style={{ left: `${TIP}%` }} />
                    {/* The counter rides just below the pommel. */}
                    <p
                      data-counter
                      data-reveal
                      className="mono absolute top-[66%] left-[4%] -translate-x-1/2 text-[0.875rem] text-snow/80"
                      style={{ rotate: `${-t.swordAngle}deg` }}
                    >
                      000
                    </p>
                  </div>
                  <Image data-preload-asset data-sheath src="/images/preloader/sheath.webp" alt="" {...art} className="relative h-auto w-full" />
                </div>
              </div>
            </div>

            {/* Wave 3: ENEMIES, in front of the sword. */}
            <div className="absolute inset-0">
              {ENEMIES.map((word) => (
                <EnemyWord key={word} word={word} />
              ))}
            </div>

            <FogLayer name="front" className="top-[48%] h-[57%]" />
            <canvas data-particles className="absolute inset-0 size-full" />
          </div>

          {/* Screen-space, outside the camera: vignette (overscanned too), the flash and the slash stroke. */}
          <div
            className="absolute -inset-[7.5%]"
            style={{ backgroundImage: "radial-gradient(ellipse at center, transparent 45%, var(--color-void) 100%)" }}
          />
          <div data-flash data-reveal className="absolute inset-0 bg-snow" />
          <canvas data-slash data-reveal className="absolute inset-0 size-full" />
        </div>
        {/* Hidden (scaleY 0) until the exit, from the first paint. */}
        <span data-cap className="curtain-cap top-full bg-void" style={{ transform: "scaleY(0)" }} />
      </div>

      {/* Always on top. Outside the panel, so it stays put while the panel lifts and can fly to the hero
          title. The name itself sits at ~35% of the height, in the sky above the lone figure. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center pb-[21vh]"
      >
        <div className="container-site flex flex-col items-center gap-6 text-center md:gap-8">
          <div data-name data-reveal className="display flex flex-wrap justify-center gap-x-[0.3em] text-snow">
            {NAME.map((word) => (
              <span key={word} data-name-word className="block">
                {word}
              </span>
            ))}
          </div>
          <span data-name-line data-reveal className="block h-px w-35 origin-left bg-brass" />
          <p data-tagline data-reveal className="label text-mist">
            {TAGLINE}
          </p>
        </div>
      </div>

      <button
        type="button"
        data-skip
        onClick={onSkip}
        className="mono absolute right-(--gutter) bottom-8 cursor-pointer py-2 text-steel transition-colors duration-(--duration-micro) ease-out hover:text-ember md:bottom-10"
      >
        SKIP
      </button>
    </div>
  );
}
