import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyHero } from "@/components/playground/CaseStudyHero";
import { chapterOf, projects } from "@/components/playground/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/playground/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  return { title: `${project?.title ?? "Case study"} — The Lone Stand`, robots: { index: false } };
}

// Case study placeholder for testing the page transition and the case study entrance.
export default async function CaseStudyPlaceholder({ params }: PageProps<"/playground/[slug]">) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <main className="container-site section-y">
      <CaseStudyHero
        chapter={`${chapterOf(project)} · ${project.sector}`}
        title={project.title}
        meta={[
          { label: "Role", value: project.role },
          { label: "Stack", value: project.stack },
          { label: "Year", value: project.year, mono: true },
        ]}
        backHref="/playground"
      />
    </main>
  );
}
