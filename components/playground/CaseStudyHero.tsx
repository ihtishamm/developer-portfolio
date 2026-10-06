"use client";

import { getImageProps } from "next/image";
import { useRef } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { duration, ease, stagger } from "@/lib/motion";
import { usePageEntrance } from "@/components/foundation/TransitionProvider";
import { TextLink } from "@/components/ui/TextLink";

const RISE = 16; // px, label and meta fade up from here
const TITLE_AT = 0.1;
const META_AT = 0.35;
const COVER_AT = 0.5;
const COVER_DURATION = 1.6;
const COVER_SCALE = 1.25;
const BACK_AT = 1.4;

type Meta = { label: string; value: string; mono?: boolean };

type CaseStudyHeroProps = {
  chapter: string;
  title: string;
  meta: Meta[];
  backHref: string;
};

const coverAlt = "Key art: a lone figure on a frozen ridge";
const { props: desktopCover } = getImageProps({
  src: "/key-art-desktop.jpeg",
  alt: coverAlt,
  width: 2752,
  height: 1536,
  sizes: "(min-width: 1440px) 1312px, 100vw",
  priority: true,
});
const {
  props: { srcSet: mobileSrcSet },
} = getImageProps({ src: "/key-art-mobile.jpeg", alt: coverAlt, width: 1536, height: 2752, sizes: "100vw" });

// Case study opener: label, title, Role/Stack/Year, cover, back link.
// Entrance: label fades up, title rises from its mask, meta staggers in, cover wipes up from the bottom
// while the image settles from 1.25, then the back link fades in.
export function CaseStudyHero({ chapter, title, meta, backHref }: CaseStudyHeroProps) {
  const root = useRef<HTMLElement>(null);

  usePageEntrance(() => {
    const q = gsap.utils.selector(root);
    const titleEl = q("[data-cs='title']");
    const tl = gsap.timeline({ defaults: { ease: ease.out, duration: duration.base } });

    tl.fromTo(q("[data-cs='label']"), { autoAlpha: 0, y: RISE }, { autoAlpha: 1, y: 0 }, 0);

    gsap.set(titleEl, { autoAlpha: 1 });
    SplitText.create(titleEl, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      // Re-split on font load or resize; the returned tween keeps its progress.
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: duration.reveal,
          ease: ease.out,
          stagger: stagger.lines,
          delay: TITLE_AT,
        }),
    });

    tl.fromTo(q("[data-cs='meta']"), { autoAlpha: 0, y: RISE }, { autoAlpha: 1, y: 0, stagger: stagger.lines }, META_AT)
      .set(q("[data-cs='cover']"), { autoAlpha: 1 }, COVER_AT)
      .fromTo(
        q("[data-cs='cover']"),
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: COVER_DURATION },
        COVER_AT,
      )
      .fromTo(q("[data-cs='cover-image']"), { scale: COVER_SCALE }, { scale: 1, duration: COVER_DURATION }, COVER_AT)
      .fromTo(q("[data-cs='back']"), { autoAlpha: 0 }, { autoAlpha: 1 }, BACK_AT);
  }, root);

  return (
    <article ref={root} className="flex flex-col gap-10 md:gap-14">
      <header className="flex flex-col gap-6 md:gap-8">
        <p data-reveal data-cs="label" className="mono text-brass">
          {chapter}
        </p>
        <h1 data-reveal data-cs="title" className="display max-w-[12ch]">
          {title}
        </h1>
      </header>

      <dl className="grid grid-cols-1 gap-6 border-t border-slate pt-6 sm:grid-cols-3 md:grid-cols-12">
        {meta.map((item) => (
          <div key={item.label} data-reveal data-cs="meta" className="flex flex-col gap-2 md:col-span-4">
            <dt className="label text-steel">{item.label}</dt>
            <dd className={item.mono ? "mono text-snow" : "body text-snow"}>{item.value}</dd>
          </div>
        ))}
      </dl>

      <div data-reveal data-cs="cover" className="relative aspect-4/5 overflow-hidden bg-iron md:aspect-16/9">
        <div data-cs="cover-image" className="absolute inset-0">
          <picture>
            <source media="(max-width: 767px)" srcSet={mobileSrcSet} />
            <img {...desktopCover} alt={coverAlt} className="size-full object-cover" />
          </picture>
        </div>
      </div>

      <div data-reveal data-cs="back" className="self-start">
        <TextLink href={backHref} className="label">
          Back to the playground
        </TextLink>
      </div>
    </article>
  );
}
