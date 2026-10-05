// Motion tokens. Mirrors the CSS tokens in app/globals.css (see CLAUDE.md).

export const ease = {
  out: "expo.out",
  inOut: "power3.inOut",
  linear: "none",
} as const;

export const duration = {
  micro: 0.3,
  fade: 0.4,
  base: 0.8,
  reveal: 1.2,
  cinematic: 1.8,
} as const;

export const stagger = {
  lines: 0.08,
  chars: 0.03,
} as const;

export const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
export const fullMotionQuery = "(prefers-reduced-motion: no-preference)";
