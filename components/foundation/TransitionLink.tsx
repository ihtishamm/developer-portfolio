"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { usePageTransition } from "@/components/foundation/TransitionProvider";

type TransitionLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
  href: string;
  /** Chapter card label, e.g. "Chapter 01". */
  chapter?: string;
  /** Chapter card title, split into letters on the curtain. */
  title?: string;
};

const isInternal = (href: string) => href.startsWith("/") && !href.startsWith("//");

// The site's link. Internal links play the page transition; external, mailto, new-tab and modified
// clicks behave natively. A consumer onClick that calls preventDefault() takes over (e.g. the menu).
export function TransitionLink({ href, chapter, title, onClick, target, ...props }: TransitionLinkProps) {
  const { navigate } = usePageTransition();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || !isInternal(href)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (target && target !== "_self") return;
    e.preventDefault();
    navigate(href, chapter || title ? { chapter, title } : undefined);
  };

  return <Link href={href} target={target} onClick={handleClick} {...props} />;
}
