// Site-wide navigation and social links. Shared by the top bar and the fullscreen menu.
// chapter/title feed the transition's chapter card when a link leaves the current page.

export const navLinks = [
  { label: "Journey", href: "/#journey", chapter: "Part 01", title: "The Journey" },
  { label: "Battles", href: "/#battles", chapter: "Part 02", title: "Battles Won" },
  { label: "Armory", href: "/#armory", chapter: "Part 03", title: "The Armory" },
  { label: "Raven", href: "/#raven", chapter: "Part 04", title: "Send a Raven" },
] as const;

export const socialLinks = [
  { label: "GitHub", href: "https://github.com/ihtishamm", external: true },
  { label: "LinkedIn", href: "https://linkedin.com/in/ihtishamhassan", external: true },
  { label: "Email", href: "mailto:ahtishamhassan167@gmail.com", external: false },
] as const;

// The preloader's foes: they charge out of the fog and are cut down by a single slash.
export const ENEMIES = ["deadlines", "legacy code", "production bugs", "scope creep"] as const;

// The horde that charges past before ENEMIES arrive (waves 1 and 2). Mobile uses the first four.
export const ENEMY_HORDE = [
  "flaky tests",
  "merge conflicts",
  "tech debt",
  "memory leaks",
  "race conditions",
  "breaking changes",
  "vague specs",
  "cache invalidation",
  "timezones",
  "off-by-one",
] as const;
