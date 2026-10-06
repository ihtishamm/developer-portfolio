import { gsap } from "@/lib/gsap";
import { preloader } from "@/lib/motion";

const config = preloader.particles;
const SWAY_RATE = 0.8; // radians per second of the sideways sway
const MARGIN = 40; // px past the canvas edge before a particle respawns
const SPAWN_RADIUS = 180; // px around the vanishing point where charging particles respawn
const CHARGED = 0.3; // charge above which particles respawn at the vanishing point

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number; // px/s: falling for snow, rising for ash
  alpha: number;
  sway: number;
  phase: number;
  rush: number;
  ash: boolean;
};

export type ParticleState = {
  /** 0 calm, 1 full charge: particles stream outward from the vanishing point, stretching as they speed up. */
  charge: number;
  /** Time multiplier: 0 freezes, the slash's slow motion slows them too. */
  speed: number;
};

const between = ([min, max]: readonly [number, number]) => min + (max - min) * Math.random();

/**
 * Snow and ash on a canvas: three depths of snow drifting down with a sideways sway, and a few brass
 * ash flecks drifting up. During the charge everything rushes outward from `vanish` (canvas px) and
 * stretches along its travel (at most maxStretch times its size), so it reads as coming at the camera,
 * never as light-speed lines. Draws on gsap.ticker; skips frames while the tab is hidden.
 */
export function createParticles(canvas: HTMLCanvasElement, vanish: { x: number; y: number }, mobile: boolean) {
  const ctx = canvas.getContext("2d");
  const state: ParticleState = { charge: 0, speed: 1 };
  if (!ctx) return { state, destroy: () => {} };

  const styles = getComputedStyle(document.documentElement);
  const snow = styles.getPropertyValue("--color-snow").trim();
  const brass = styles.getPropertyValue("--color-brass").trim();
  const share = mobile ? 0.5 : 1;

  let width = 0;
  let height = 0;
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  resize();

  const particles: Particle[] = [];
  config.layers.forEach((layer) => {
    for (let i = 0; i < Math.round(layer.count * share); i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: between(layer.size),
        speed: between(layer.fall),
        alpha: between(layer.alpha),
        sway: layer.sway,
        phase: Math.random() * Math.PI * 2,
        rush: layer.rush,
        ash: false,
      });
    }
  });
  for (let i = 0; i < Math.max(1, Math.round(config.ash.count * share)); i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: between(config.ash.size),
      speed: -between(config.ash.rise),
      alpha: between(config.ash.alpha),
      sway: config.ash.sway,
      phase: Math.random() * Math.PI * 2,
      rush: 1,
      ash: true,
    });
  }

  // Off screen: calm snow re-enters at the top (ash at the bottom); mid-charge, near the vanishing point.
  const respawn = (p: Particle) => {
    if (state.charge > CHARGED) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * SPAWN_RADIUS;
      p.x = vanish.x + Math.cos(angle) * radius;
      p.y = vanish.y + Math.sin(angle) * radius;
    } else {
      p.x = Math.random() * width;
      p.y = p.ash ? height + p.size : -p.size;
    }
  };

  let elapsed = 0;
  const tick = (_time: number, deltaTime: number) => {
    if (document.hidden) return;
    const dt = Math.min(deltaTime / 1000, config.maxDelta) * state.speed;
    elapsed += dt;
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      // Calm drift: fall (or rise) with a sideways sway.
      const swayVelocity = Math.cos(elapsed * SWAY_RATE + p.phase) * p.sway;
      // Charge: rush outward from the vanishing point, faster the closer the layer and the further out.
      const rush = state.charge * config.rushSpeed * p.rush;
      const rushX = (p.x - vanish.x) * rush;
      const rushY = (p.y - vanish.y) * rush;
      const vx = swayVelocity + rushX;
      const vy = p.speed + rushY;
      p.x += vx * dt;
      p.y += vy * dt;

      if (p.x < -MARGIN || p.x > width + MARGIN || p.y < -MARGIN || p.y > height + MARGIN) respawn(p);

      // Same colours and opacity as the calm state. The rush (not the calm drift) stretches the dot
      // along its travel; velocity, not dt, sets the stretch, so frozen particles keep their shape.
      const stretch = Math.min(config.maxStretch, 1 + Math.hypot(rushX, rushY) / config.stretchSpeed);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.ash ? brass : snow;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * stretch, p.size, Math.atan2(vy, vx), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  gsap.ticker.add(tick);
  window.addEventListener("resize", resize);
  return {
    state,
    destroy: () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", resize);
    },
  };
}
