import Image from "next/image";
import { preloader } from "@/lib/motion";

type FogLayerProps = {
  name: "back" | "mid" | "front";
  /** Vertical band the layer occupies (top/height). */
  className: string;
};

// Soft top and bottom edges, so a band never shows a hard line.
const FADE = "linear-gradient(to bottom, transparent, var(--color-void) 30%, var(--color-void) 70%, transparent)"; // only alpha matters

// One drifting fog layer, screen-blended over the scene. The fog photos don't tile, so the strip is the
// image, its mirror, then the image again: every seam meets its own reflection, and shifting the strip by
// two copies (2/3 of its width) lands on an identical frame, so the drift loops without a jump.
// Each copy is as tall as the band and at least as wide as the overscanned camera (115vw; art is 2560x1429).
export function FogLayer({ name, className }: FogLayerProps) {
  return (
    <div
      data-fog={name}
      className={`pointer-events-none absolute inset-x-0 mix-blend-screen ${className}`}
      style={{ opacity: preloader.fogOpacity[name], maskImage: FADE, WebkitMaskImage: FADE }}
    >
      <div data-fog-strip data-reveal className="flex h-full w-max will-change-transform">
        {[false, true, false].map((mirrored, i) => (
          <div
            key={i}
            className={`relative aspect-2560/1429 h-full min-w-[115vw] shrink-0 ${mirrored ? "-scale-x-100" : ""}`}
          >
            <Image
              src={`/images/preloader/fog-${name}.webp`}
              alt=""
              fill
              unoptimized
              loading="eager"
              fetchPriority={i === 0 ? "high" : "auto"}
              data-preload-asset={i === 0 ? "" : undefined}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
