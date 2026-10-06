import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { ScrollToTopButton } from "@/components/playground/ScrollToTopButton";

export const metadata: Metadata = {
  title: "Playground — The Lone Stand",
  robots: { index: false },
};

const rows = [
  { year: "2025", title: "Ledger of the North", role: "Full-stack · Fintech" },
  { year: "2024", title: "Iron Courier", role: "Backend · Logistics" },
  { year: "2024", title: "Hollow Watch", role: "Frontend · Monitoring" },
  { year: "2023", title: "Frostline Atlas", role: "Full-stack · Mapping" },
];

// Test bench for the foundation layer: cursor states, magnetic button, smooth scroll.
export default function Playground() {
  return (
    <main className="container-site section-y flex flex-col gap-24 md:gap-32">
      <header className="flex flex-col gap-6">
        <p className="label text-steel">Foundation · Part A</p>
        <h1 className="h1">Playground</h1>
        <p className="body max-w-xl">
          Move fast to throw sparks. Hover a row for the view state. The button below is magnetic and hides the cursor.
        </p>
      </header>

      <section className="flex flex-col gap-8">
        <p className="label text-steel">Cursor: view</p>
        <ul className="border-t border-slate">
          {rows.map((row) => (
            <li
              key={row.title}
              data-cursor="view"
              className="grid grid-cols-4 items-baseline gap-x-6 gap-y-2 border-b border-slate py-8 md:grid-cols-12 md:py-10"
            >
              <span className="mono col-span-1 text-steel md:col-span-2">{row.year}</span>
              <h2 className="h3 col-span-3 md:col-span-6">{row.title}</h2>
              <span className="label col-span-3 col-start-2 text-steel md:col-span-4 md:col-start-auto md:text-right">
                {row.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col items-start gap-8">
        <p className="label text-steel">Magnetic primary button</p>
        <Button>Send a raven</Button>
      </section>

      <div aria-hidden="true" className="h-[150dvh] border-l border-slate" />

      <section className="flex flex-col items-start gap-8">
        <p className="label text-steel">SmoothScroll context: scrollTo(0)</p>
        <ScrollToTopButton />
      </section>
    </main>
  );
}
