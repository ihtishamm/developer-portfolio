"use client";

import { useSmoothScroll } from "@/components/foundation/SmoothScroll";
import { Button } from "@/components/ui/Button";

// Exercises the SmoothScroll context API.
export function ScrollToTopButton() {
  const { scrollTo } = useSmoothScroll();
  return <Button onClick={() => scrollTo(0)}>Back to the top</Button>;
}
