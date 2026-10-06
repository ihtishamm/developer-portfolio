// Preloader state, shared by the root layout's head script, the Preloader and anything that waits for it.
// <html data-preloader> is absent while it runs, "skip" when it never runs (seen this session, or
// reduced motion) and "done" once it has finished.

import { reducedMotionQuery } from "./motion";

export const PRELOADER_SEEN_KEY = "lone-stand-seen";
export const PRELOADER_DONE_EVENT = "lone-stand:done";

// Inlined in <head>: runs while the HTML is parsed, so a repeat visit never paints the preloader.
export const preloaderHeadScript = `(function(){try{if(sessionStorage.getItem("${PRELOADER_SEEN_KEY}"))document.documentElement.setAttribute("data-preloader","skip")}catch(e){}})()`;

export function hasSeenPreloader() {
  try {
    return sessionStorage.getItem(PRELOADER_SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

export function isPreloaderDone() {
  return (
    document.documentElement.hasAttribute("data-preloader") ||
    window.matchMedia(reducedMotionQuery).matches ||
    hasSeenPreloader()
  );
}

/** Calls `callback` once the preloader has finished (immediately if it isn't running). Returns a cleanup. */
export function whenPreloaderDone(callback: () => void) {
  if (isPreloaderDone()) {
    callback();
    return () => {};
  }
  window.addEventListener(PRELOADER_DONE_EVENT, callback, { once: true });
  return () => window.removeEventListener(PRELOADER_DONE_EVENT, callback);
}
