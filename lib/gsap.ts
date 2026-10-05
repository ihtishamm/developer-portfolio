// Single entry point for GSAP. Every component imports from here, never from "gsap" directly.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { duration, ease } from "./motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
  gsap.defaults({ ease: ease.out, duration: duration.base });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
