import type { Metadata } from "next";
import { Cinzel, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Cursor } from "@/components/foundation/Cursor";
import { Nav } from "@/components/foundation/Nav";
import { SmoothScroll } from "@/components/foundation/SmoothScroll";
import { TransitionProvider } from "@/components/foundation/TransitionProvider";
import { Grain } from "@/components/ui/Grain";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ihtisham Hassan — Full-stack Engineer",
  description: "Portfolio of Ihtisham Hassan, full-stack engineer based in Lahore.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* JS disabled: show [data-reveal] content that GSAP would otherwise reveal. */}
        <noscript dangerouslySetInnerHTML={{ __html: "<style>[data-reveal]{visibility:visible}</style>" }} />
      </head>
      <body className="min-h-dvh">
        {/* First focusable element on every page. */}
        <a
          href="#content"
          className="small fixed top-4 left-4 z-120 -translate-y-[200%] bg-ember px-5 py-3 font-medium text-void focus:translate-y-0"
        >
          Skip to content
        </a>
        <SmoothScroll>
          <TransitionProvider>
            <Nav />
            {/* Skip-link target; inert while the menu is open; the outgoing page during a transition. */}
            <div id="content" tabIndex={-1} className="outline-none">
              {children}
            </div>
          </TransitionProvider>
        </SmoothScroll>
        <Grain />
        <Cursor />
      </body>
    </html>
  );
}
