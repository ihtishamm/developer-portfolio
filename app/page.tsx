import { TextLink } from "@/components/ui/TextLink";

// Placeholder until the Hero section is built.
export default function Home() {
  return (
    <main className="container-site section-y flex min-h-dvh flex-col justify-center gap-8">
      <p className="label text-steel">Under construction</p>
      <h1 className="display">The Lone Stand</h1>
      <TextLink href="/styleguide" className="self-start">View the styleguide</TextLink>
    </main>
  );
}
