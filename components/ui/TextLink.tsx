import type { ComponentProps } from "react";
import { TransitionLink } from "@/components/foundation/TransitionLink";

type TextLinkProps = ComponentProps<typeof TransitionLink> & {
  /** Pin the hover state on, for documentation only. */
  forceHover?: boolean;
};

// Secondary text link (a TransitionLink, so internal hrefs play the page transition). Slate rule at rest; on hover an ember rule draws in from the left.
export function TextLink({ forceHover, className = "", children, ...props }: TextLinkProps) {
  return (
    <TransitionLink
      data-hover={forceHover ? "" : undefined}
      className={`group relative inline-block pb-1 text-snow transition-colors duration-(--duration-micro) ease-out hover:text-ember data-hover:text-ember ${className}`}
      {...props}
    >
      {children}
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-slate" />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-ember transition-transform duration-(--duration-micro) ease-out group-hover:scale-x-100 group-data-hover:scale-x-100"
      />
    </TransitionLink>
  );
}
