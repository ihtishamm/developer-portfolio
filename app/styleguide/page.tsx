import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";
import { LineRevealDemo } from "@/components/styleguide/LineRevealDemo";
import { ReducedMotionDemo } from "@/components/styleguide/ReducedMotionDemo";

export const metadata: Metadata = {
  title: "Styleguide — The Lone Stand",
  robots: { index: false },
};

const colors = [
  { name: "void", hex: "#0E1216", role: "Page background", swatch: "bg-void" },
  { name: "iron", hex: "#1C232A", role: "Raised surfaces, cards", swatch: "bg-iron" },
  { name: "slate", hex: "#2A333B", role: "Borders, dividers", swatch: "bg-slate" },
  { name: "steel", hex: "#8A9BA8", role: "Secondary text, labels", swatch: "bg-steel" },
  { name: "mist", hex: "#C9D1D6", role: "Body text", swatch: "bg-mist" },
  { name: "snow", hex: "#E6E9EB", role: "Headings, primary text", swatch: "bg-snow" },
  { name: "ember", hex: "#CC5C30", role: "Interactive accent only: CTAs, focus, cursor", swatch: "bg-ember" },
  { name: "ember-hover", hex: "#D96A3D", role: "Hover state of ember fills", swatch: "bg-ember-hover" },
  { name: "brass", hex: "#B08D57", role: "Decorative accent only: map route, sigils, ornaments", swatch: "bg-brass" },
  { name: "parchment", hex: "#D8CBB0", role: "Journey map section only", swatch: "bg-parchment" },
];

const typeStyles = [
  { name: "display", className: "display text-snow", specs: "Cinzel 400 · clamp(3.5rem, 10vw, 10rem) · 0.95 · 0.02em", sample: "The Lone Stand" },
  { name: "h1", className: "h1 text-snow", specs: "Cinzel 400 · clamp(2.5rem, 6vw, 5.5rem) · 1.0 · 0.03em", sample: "Battles Won" },
  { name: "h2", className: "h2 text-snow", specs: "Cinzel 400 · clamp(2rem, 4vw, 3.5rem) · 1.1 · 0.04em", sample: "The Journey" },
  { name: "h3", className: "h3 text-snow", specs: "Cinzel 500 · clamp(1.25rem, 2vw, 1.75rem) · 1.2 · 0.06em", sample: "Send a Raven" },
  { name: "body-lg", className: "body-lg text-mist", specs: "Inter Tight 400 · 1.25rem · 1.5 · -0.01em", sample: "I build software that holds up under weight: fast interfaces, honest APIs and systems that stay calm when traffic does not." },
  { name: "body", className: "body text-mist", specs: "Inter Tight 400 · 1.0625rem · 1.6 · 0", sample: "Full-stack engineer based in Lahore. Most days that means TypeScript end to end, careful data models and a lot of attention on the last ten percent." },
  { name: "small", className: "small text-mist", specs: "Inter Tight 400 · 0.875rem · 1.5 · 0", sample: "Captions, footnotes and supporting UI copy." },
  { name: "label", className: "label text-steel", specs: "JetBrains Mono 400 · 0.75rem · 1.4 · 0.12em · uppercase", sample: "Case study · Selected work" },
  { name: "mono", className: "mono text-steel", specs: "JetBrains Mono 400 · 0.75rem · 1.4 · 0.12em · as written", sample: "2025 · 04 / 12 · 1.2s · #CC5C30" },
];

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-slate pt-12 md:pt-16">
      <div className="mb-12 flex items-baseline gap-6 md:mb-16">
        <span className="mono text-brass">{index}</span>
        <h2 className="h3">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <main className="container-site section-y flex flex-col gap-24 md:gap-32">
      <header className="flex flex-col gap-6">
        <p className="label text-steel">Design system · Winter Steel</p>
        <h1 className="h1">Styleguide</h1>
        <p className="body-lg max-w-[52ch] text-mist">
          Every token the site is built from. Atmosphere stays quiet so the work can speak.
        </p>
      </header>

      <Section index="01" title="Color">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-12">
          {colors.map((c) => (
            <li key={c.name} className="flex flex-col gap-4 lg:col-span-4">
              <div className={`aspect-[4/3] border border-slate ${c.swatch}`} />
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="body font-medium text-snow">{c.name}</span>
                  <span className="mono text-steel">{c.hex}</span>
                </div>
                <p className="small text-steel">{c.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section index="02" title="Typography">
        <ul className="flex flex-col">
          {typeStyles.map((t) => (
            <li
              key={t.name}
              className="grid grid-cols-4 gap-x-6 gap-y-4 border-b border-slate py-10 first:pt-0 last:border-b-0 lg:grid-cols-12"
            >
              <div className="col-span-4 flex flex-col gap-2 lg:col-span-3">
                <span className="label text-snow">{t.name}</span>
                <span className="mono text-steel">{t.specs}</span>
              </div>
              <p className={`col-span-4 min-w-0 lg:col-span-9 ${t.className}`}>{t.sample}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section index="03" title="Interactive">
        <div className="grid grid-cols-4 gap-x-6 gap-y-16 lg:grid-cols-12">
          <div className="col-span-4 flex flex-col gap-8 lg:col-span-6">
            <p className="label text-steel">Primary button · ember</p>
            <div className="flex flex-wrap gap-x-10 gap-y-8">
              <figure className="flex flex-col items-start gap-4">
                <Button>Send a raven</Button>
                <figcaption className="label text-steel">Default</figcaption>
              </figure>
              <figure className="flex flex-col items-start gap-4">
                <Button forceHover tabIndex={-1} aria-hidden="true">Send a raven</Button>
                <figcaption className="label text-steel">Hover</figcaption>
              </figure>
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-8 lg:col-span-6">
            <p className="label text-steel">Secondary text link</p>
            <div className="flex flex-wrap gap-x-10 gap-y-8">
              <figure className="flex flex-col items-start gap-4">
                <TextLink href="/styleguide">Read the case study</TextLink>
                <figcaption className="label text-steel">Default</figcaption>
              </figure>
              <figure className="flex flex-col items-start gap-4">
                <TextLink href="/styleguide" forceHover tabIndex={-1} aria-hidden="true">
                  Read the case study
                </TextLink>
                <figcaption className="label text-steel">Hover</figcaption>
              </figure>
            </div>
          </div>
        </div>
      </Section>

      <Section index="04" title="Headline reveal">
        <LineRevealDemo />
      </Section>

      <Section index="05" title="Reduced motion">
        <ReducedMotionDemo />
      </Section>
    </main>
  );
}
