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
