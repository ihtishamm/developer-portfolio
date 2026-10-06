@AGENTS.md
# Portfolio: "The Lone Stand"

Personal portfolio for Ihtisham Hassan, full-stack engineer (Lahore).
Cinematic, editorial, scroll-storytelling site with a cold northern medieval atmosphere.
Theme is atmosphere only (20%). The work and the person are the story (80%).

## Hard rules
- NEVER use Game of Thrones / HBO assets, names, logos, characters, music or quotes. Original work only.
- Build ONE section at a time. Never touch an approved section without asking first.
- After finishing any section, use Playwright to screenshot at 1440px, 768px and 390px widths and report what you see before saying it's done.
- Every section must pass: 60fps scroll, no layout shift, works on mobile, respects prefers-reduced-motion.

## Stack
- Next.js (App Router) + TypeScript + Tailwind v4
- GSAP + @gsap/react (useGSAP) + ScrollTrigger + SplitText
- Lenis for smooth scroll (one global instance, synced to ScrollTrigger)
- Motion only for UI state changes and route transitions, never on the same element as GSAP
- next/font for fonts, next/image for images
- Resend for the contact form
- Deploy on Vercel

## Code rules
- Server components by default. "use client" only on components that animate or need state.
- Every GSAP animation lives inside useGSAP with a scope ref, so cleanup is automatic.
- Register plugins once in a shared lib/gsap.ts file.
- Animate transform and opacity only. Never animate width, height, top, left or filter on scroll.
- clip-path is allowed for reveals and masks (e.g. the menu's circle wipe).
- No magic numbers for colors, fonts, easing or durations. Use the tokens below.
- Keep components small: one section = one folder in components/sections/.

## Colors (Winter Steel)
| Token     | Hex     | Use |
|-----------|---------|-----|
| void      | #0E1216 | Page background |
| iron      | #1C232A | Raised surfaces, cards |
| slate     | #2A333B | Borders, dividers |
| steel     | #8A9BA8 | Secondary text, labels |
| mist      | #C9D1D6 | Body text |
| snow      | #E6E9EB | Headings, primary text |
| ember     | #CC5C30 | Interactive accent ONLY: CTAs, focus, cursor |
| ember-hover | #D96A3D | Hover state of ember fills ONLY |
| brass     | #B08D57 | Decorative accent ONLY: map route, sigils, ornaments |
| parchment | #D8CBB0 | Journey map section only |

Rules:
- Ember is the only color that means "you can click this." Never use it decoratively.
- Brass is never clickable.
- Text on ember buttons uses void.
- Primary button hover: fill shifts ember → ember-hover (never drains to outline), arrow slides 4px right, micro + ease-out. The arrow is an inline SVG sized to the text cap height (1cap), vertically centered. No arrow characters.
- No pure black (#000) or pure white (#fff) anywhere.

## Typography
- Display: Cinzel (400, 500). Headings only. Never below 18px. Never for body text or buttons.
- Wordmark exception: the site name ("IHTISHAM HASSAN") may use Cinzel at 14px minimum, uppercase, tracking 0.12em. The 18px minimum applies everywhere else.
- Body: Inter Tight (400, 500). All paragraphs, nav, buttons, UI.
- Mono: JetBrains Mono (400). Labels, dates, metadata, counters.

| Style      | Font        | Size                          | Line height | Tracking |
|------------|-------------|-------------------------------|-------------|----------|
| display    | Cinzel      | clamp(3.5rem, 10vw, 10rem)    | 0.95        | 0.02em   |
| h1         | Cinzel      | clamp(2.5rem, 6vw, 5.5rem)    | 1.0         | 0.03em   |
| h2         | Cinzel      | clamp(2rem, 4vw, 3.5rem)      | 1.1         | 0.04em   |
| h3         | Cinzel      | clamp(1.25rem, 2vw, 1.75rem)  | 1.2         | 0.06em   |
| body-lg    | Inter Tight | 1.25rem                       | 1.5         | -0.01em  |
| body       | Inter Tight | 1.0625rem                     | 1.6         | 0        |
| small      | Inter Tight | 0.875rem                      | 1.5         | 0        |
| label      | JetBrains   | 0.75rem, uppercase            | 1.4         | 0.12em   |
| mono       | JetBrains   | 0.75rem, no text-transform    | 1.4         | 0.12em   |

- label is for words only. Numbers, units, dates, hex codes and code values use mono so they are never uppercased ("1.2s", not "1.2S").

## Layout and spacing
- 4px base unit. Use Tailwind spacing scale.
- Container: max-width 1440px, side gutters clamp(1.25rem, 4vw, 4rem).
- 12-column grid on desktop, 4-column on mobile.
- Section vertical padding: clamp(6rem, 12vw, 12rem).
- Generous whitespace. When in doubt, more space.

## Motion language
Feel: heavy, deliberate, cinematic. Like steel being drawn, not like a bouncy app.

| Token      | Value                                   | Use |
|------------|-----------------------------------------|-----|
| ease-out   | "expo.out" / cubic-bezier(0.16,1,0.3,1) | Default for all entrances |
| ease-inout | "power3.inOut"                          | Page transitions, pinned scenes |
| micro      | 0.3s                                    | Hovers, cursor, buttons |
| base       | 0.8s                                    | Element reveals |
| reveal     | 1.2s                                    | Headline reveals |
| cinematic  | 1.8s                                    | Preloader, hero intro |
| stagger    | 0.08s lines, 0.03s chars                | Text reveals |

Rules:
- No elastic, back or bounce easing. Ever.
- Headline reveals: split into lines, each line slides up from yPercent 110 inside an overflow-hidden mask.
- Scroll-driven scenes use ScrollTrigger with scrub; only these reverse, naturally, with scroll.
- Entrance animations play once: toggleActions "play none none none" (or once: true). Never reverse an entrance.
- No flash on load: every element that animates in gets the data-reveal attribute (visibility: hidden in CSS before first paint). GSAP reveals it with autoAlpha. Under prefers-reduced-motion or with JS disabled (noscript style in the root layout), data-reveal elements are visible immediately.
- Lenis: lerp 0.08, smoothWheel true. Disable on touch devices.
- Reduced motion: no preloader, no parallax, no scrub, no smooth scroll. data-reveal content is shown immediately; user-triggered changes may use a simple 0.4s opacity fade only.

## Foundation components (components/foundation/)
SmoothScroll, Cursor and Magnetic run only on `(pointer: fine) and (prefers-reduced-motion: no-preference)` (`finePointerMotionQuery` in lib/motion.ts). Elsewhere: native scroll, native cursor, no magnetic pull.

- **SmoothScroll**: wraps the app in the root layout. One global Lenis, driven by gsap.ticker and synced to ScrollTrigger. Never create another Lenis. Use the hook from client components:
  ```tsx
  const { stop, start, scrollTo } = useSmoothScroll();
  scrollTo("#contact", { offset: -80 }); // number | selector | element; falls back to native scroll
  ```
- **Cursor**: mounted once in the root layout. Never mount it again. Set the state with a data attribute on any element (the nearest ancestor wins):
  | Attribute | Effect |
  |-----------|--------|
  | (none) | Ember dot + steel ring with velocity stretch and brass sparks |
  | `data-cursor="view"` | Ring grows to 88px, fills ember, shows "VIEW"; dot hides. Use on project rows and cards. |
  | `data-cursor="hide"` | Ring and dot fade out. Set automatically by Magnetic. |
  Sparks are toggled by `SPARKS_ENABLED` in Cursor.tsx.
- **Magnetic**: pulls its child toward the pointer (outer and inner layers) and sets `data-cursor="hide"`. The primary `Button` is already magnetic, so don't wrap it again. Use `wrapperClassName` on Button for layout classes (self-alignment, margins, grid placement), since they belong on the wrapper.
  ```tsx
  <Magnetic className="self-start"><a href="…">…</a></Magnetic>
  ```
- **Nav + Menu**: mounted once in the root layout (inside SmoothScroll). Links live in lib/site.ts.
  - Top bar (desktop): wordmark left (links home), Journey / Battles / Armory / Raven as label TextLinks right. Past one viewport height it slides up and fades out and a 52px round iron menu button (0.5px slate border, Magnetic) scales in top right; reverses at the top. Below 768px only the menu button shows, always.
  - Menu: fixed fullscreen iron overlay, opened by a clip-path circle from the button's centre. Wordmark top left (links home), h1 Cinzel links with brass mono indexes, mono social links at the bottom. Hovering a link dims the others, nudges it right and shows an ember dot. Hamburger morphs into an X.
  - While open: Lenis stopped, `#content` inert, focus trapped, Esc closes, focus returns to the button. Link clicks close first, then scroll or navigate.
- Skip link: "Skip to content" is the first focusable element in the root layout and targets `#content`, the wrapper around every page.
- /playground is the test bench for these (noindex).

## Texture and atmosphere
- Film grain: fixed full-screen SVG feTurbulence overlay, opacity 0.06, pointer-events none, subtle animated shift.
- Fog: only in preloader and hero. Layered PNGs drifting slowly, plus parallax.
- No gradients except fog fades. No drop shadows. No glow effects.

## Sections (build order)
1. Foundation: layout, Lenis, grain, cursor, nav, page transition shell
2. Preloader: "The Lone Stand"
3. Hero
4. The Journey (pinned horizontal scroll over the map)
5. Battles Won (project list with cursor-following previews)
6. Case study page template
7. The Armory (skills)
8. Send a Raven (contact)
9. Footer

