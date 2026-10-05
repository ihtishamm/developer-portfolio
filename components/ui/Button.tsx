import type { ComponentPropsWithoutRef } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  /** Pin the hover state on, for documentation only. */
  forceHover?: boolean;
};

// Primary CTA. On hover the fill shifts to ember-hover and the arrow slides 4px right.
export function Button({ forceHover, className = "", children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      data-hover={forceHover ? "" : undefined}
      className={`group inline-flex cursor-pointer items-center gap-3 bg-ember px-7 py-4 small font-medium uppercase tracking-label text-void transition-colors duration-(--duration-micro) ease-out hover:bg-ember-hover data-hover:bg-ember-hover ${className}`}
      {...props}
    >
      <span>{children}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        className="h-[1cap] w-auto shrink-0 transition-transform duration-(--duration-micro) ease-out group-hover:translate-x-1 group-data-hover:translate-x-1"
      >
        <path d="M0 5h14.5M10.5 1l4 4-4 4" />
      </svg>
    </button>
  );
}
