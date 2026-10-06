// Site-wide navigation and social links. Shared by the top bar and the fullscreen menu.

export const navLinks = [
  { label: "Journey", href: "/#journey" },
  { label: "Battles", href: "/#battles" },
  { label: "Armory", href: "/#armory" },
  { label: "Raven", href: "/#raven" },
] as const;

export const socialLinks = [
  { label: "GitHub", href: "https://github.com/ihtishamm", external: true },
  { label: "LinkedIn", href: "https://linkedin.com/in/ihtishamhassan", external: true },
  { label: "Email", href: "mailto:ahtishamhassan167@gmail.com", external: false },
] as const;
