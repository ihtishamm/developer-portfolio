import { TextLink } from "@/components/ui/TextLink";

// Placeholder until the Hero section is built. The title is the preloader's Flip target: keep
// data-flip-id="hero-name" and one data-flip-word span per word on the real hero title.
export default function Home() {
  return (
    <main className="container-site flex min-h-dvh flex-col justify-between gap-16 pt-32 pb-(--section-y) md:pt-40">
      <h1 data-flip-id="hero-name" className="display">
        <span data-flip-word className="inline-block">IHTISHAM</span>{" "}
        <span data-flip-word className="inline-block">HASSAN</span>
      </h1>
      <div className="flex flex-col gap-8">
        <p className="label text-steel">Under construction</p>
        <TextLink href="/styleguide" className="self-start">View the styleguide</TextLink>
      </div>
    </main>
  );
}
