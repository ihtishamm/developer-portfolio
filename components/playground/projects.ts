// Placeholder projects for the playground test bench.
export const projects = [
  { slug: "ledger-of-the-north", year: "2025", title: "Ledger of the North", role: "Full-stack", sector: "Fintech", stack: "Next.js · Postgres · Stripe" },
  { slug: "iron-courier", year: "2024", title: "Iron Courier", role: "Backend", sector: "Logistics", stack: "Node · Redis · Kafka" },
  { slug: "hollow-watch", year: "2024", title: "Hollow Watch", role: "Frontend", sector: "Monitoring", stack: "React · D3 · WebSockets" },
  { slug: "frostline-atlas", year: "2023", title: "Frostline Atlas", role: "Full-stack", sector: "Mapping", stack: "Next.js · PostGIS · Mapbox" },
] as const;

export type Project = (typeof projects)[number];

export const chapterOf = (project: Project) =>
  `Chapter ${String(projects.indexOf(project) + 1).padStart(2, "0")}`;
