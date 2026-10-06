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

// Fine pointer with motion allowed: smooth scroll, custom cursor and magnetic effects only run here.
export const finePointerMotionQuery = "(pointer: fine) and (prefers-reduced-motion: no-preference)";

// Preloader ("The Lone Stand"). Times are seconds. Intro times are absolute; everything after the draw
// is relative to the moment the sword is fully drawn, which is 1.8s when assets are already loaded
// (drawAt + minDraw). Distances in px are screen pixels unless noted.
export const preloader = {
  // Scene. The camera, key art, fog and particles overscan the viewport (115%), so the push-in, shake
  // and jolt never reveal an edge.
  keyArtBrightness: 0.3, // static CSS filter, never animated
  // The key art is anchored to the top of the camera at this share of its height, so the lone figure
  // stands in the lower third and the sky holds the name. Desktop art at every size: the mobile figure
  // art is a different frame from the mobile plain art, so the two would not crossfade cleanly.
  keyArtHeight: 1.446,
  keyArtFadeDuration: 1.5,
  fogOpacity: { back: 0.25, mid: 0.18, front: 0.12 },
  fogLoop: { back: 140, mid: 90, front: 55 }, // seconds per seamless loop: back slowest, front fastest
  cameraZoom: 1.08, // the scene wrapper's linear push-in over the whole intro
  cameraDuration: 5,
  // The horizon glow in the key art (fractions of the image), where the charge comes from. Clamped to
  // stay on screen: the portrait crop pushes it past the right edge on mobile.
  vanishingPoint: [0.705, 0.348],
  vanishingClamp: { min: 0.2, max: 0.8 },

  // Intro (absolute).
  introAt: 0.3, // the light line flashes at the sword's place...
  lightLineIn: 0.1,
  lightLineOut: 0.1, // ...and is gone before the sword appears
  drawAt: 0.5, // sword and sheath fade in and the draw starts
  swordInDuration: 0.6,
  swordAngle: -4, // deg
  // Framing: at full draw the pommel sits here (share of the viewport width from the left), which keeps
  // the whole sword at least 6% inside the frame after the camera's push-in. The sword does this share
  // of the draw's travel (so the pommel and its counter travel left); the sheath is pulled right for the rest.
  pommelAt: 0.09,
  drawShare: { desktop: 0.35, mobile: 0.3 },
  minDraw: 1.3, // the draw never finishes faster than this
  timeout: 6, // stop waiting on fonts and images after this
  drawEase: "power2.inOut", // the counter's curve when loading isn't the bottleneck
  progressRate: 14, // per second, how quickly the counter eases toward real progress

  // After the draw (relative).
  glintDuration: 0.45, // guard to tip
  glintEase: "power1.inOut",
  counterOutAt: 0.35,
  counterOutDuration: 0.3,

  // The charge, in perspective from the vanishing point. Waves 1 and 2 are the horde and fly past the
  // camera; wave 3 is ENEMIES and stops large on the hard stop.
  stopAt: 1.2, // charge length; everything freezes here
  waveAt: [0, 0.12, 0.2],
  waveJitter: 0.06, // random start offset within a wave
  hordeDuration: { min: 0.9, max: 1.05 }, // always out of frame before the stop
  hordeScale: { from: 0.15, to: 3.2 },
  hordeReach: 1.3, // how far past the screen each word travels, as a share of the viewport diagonal
  enemyDuration: 1, // wave 3 lands exactly on the stop
  chargeEase: "expo.in",
  approachEase: "power3.in", // opacity and brightness rise as a word closes in
  prewarmOpacity: 0.001, // words are painted, invisibly, before they charge
  shake: { desktop: 6, mobile: 3 }, // px, builds from 0 across the charge
  trembleAt: 1, // ENEMIES tremble just before the stop
  tremble: 1.5, // px
  fogChargeSpeed: 4, // drift timeScale at the end of the charge

  // Where ENEMIES stop (order matches ENEMIES): centre as a share of the viewport, and a scale over the
  // h2 base. Two left, two right, above and below the sword, different sizes and depths, never
  // overlapping each other or the sword; scope creep runs off the right edge.
  enemyStops: {
    desktop: [
      { x: 0.28, y: 0.22, scale: 1.8 },
      { x: 0.75, y: 0.17, scale: 1.45 },
      { x: 0.27, y: 0.87, scale: 1.2 },
      { x: 0.8, y: 0.74, scale: 2.4 },
    ],
    mobile: [
      { x: 0.3, y: 0.24, scale: 1.05 },
      { x: 0.68, y: 0.33, scale: 0.85 },
      { x: 0.38, y: 0.66, scale: 0.7 },
      { x: 0.78, y: 0.78, scale: 1.4 },
    ],
  },

  // The slash, in real time: the sword whips along the cut, pivoting on its tip (so the tip runs straight
  // down the line), and is fully out of frame when the whip ends. Ghost copies trail it.
  slashAt: 1.35, // after 0.15s of stillness
  slashAngle: -38, // deg, the cut line through the blade tip; the swing ends on it (34deg from rest), so
  // the sword trails straight behind its tip and the overshoot carries all of it out of frame
  whipDuration: 0.18, // under 0.25s, so the sword is out of frame by then
  whipEase: "power4.out",
  whipOvershoot: 1.15, // the tip travels past the edge by this many sword lengths
  ghostOpacity: [0.3, 0.15, 0.05],
  ghostLag: 0.016, // s between the sword and each ghost
  ghostFade: 0.15,
  slashWidth: 4, // px at the middle of the stroke, tapering to nothing at both ends
  slashHold: 0.12, // fully bright...
  slashFade: 0.15, // ...then gone
  flashOpacity: 0.25,
  flashDuration: 0.09,
  jolt: 14, // px, one hard camera kick at the cut...
  joltDuration: 0.35, // ...settling
  // Slow motion: only the word halves and the particles, on their own timeline.
  splitAt: 0.05, // after the slash starts, as the line passes
  slowScale: 0.35, // their timeScale...
  slowReal: 0.5, // ...for this long in real time
  splitDistance: { min: 40, max: 80 }, // px, perpendicular to the cut
  splitRotation: { min: 3, max: 6 }, // deg, opposite ways
  splitTail: 0.07, // the halves keep fading this long at full speed after slow motion
  fogJolt: { back: 1.06, mid: 1.12, front: 1.2 }, // scale, outward from the cut
  fogSettleDuration: 1,

  // Calm: the lone figure appears, the name rises above him.
  figureFadeDuration: 0.8,
  nameGap: 0.05, // after the halves are gone
  lineDelay: 0.25, // brass line draws in under the name
  lineDuration: 1,
  taglineDelay: 0.55,
  exitAfterName: 1.1,

  // Exit.
  liftDuration: duration.reveal,
  liftTravel: 110, // yPercent, far enough that the bottom cap clears the viewport too
  fogPart: 0.3, // fraction of the viewport each fog layer moves out
  fogPartDuration: 1,
  flipDuration: duration.reveal,

  // Snow and ash. Counts are halved on mobile. Speeds in px/s.
  particles: {
    layers: [
      { count: 60, size: [0.6, 1.1], fall: [16, 28], alpha: [0.2, 0.35], sway: 8, rush: 1 }, // far
      { count: 32, size: [1, 1.7], fall: [28, 46], alpha: [0.35, 0.55], sway: 14, rush: 1.6 }, // mid
      { count: 12, size: [1.8, 3], fall: [46, 72], alpha: [0.45, 0.7], sway: 20, rush: 2.4 }, // near
    ],
    ash: { count: 6, size: [1, 1.8], rise: [10, 22], alpha: [0.35, 0.6], sway: 12 },
    rushSpeed: 1.6, // per second, outward from the vanishing point at full charge (times distance)
    maxStretch: 3, // fast particles stretch along their travel, up to this many times their size...
    stretchSpeed: 400, // ...one extra size per this many px/s
    settleDuration: 1.2, // back to calm after the slash
    maxDelta: 0.05, // s, clamp after a hidden tab or a long frame
  },
} as const;
