import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./polish.css";
import "./products/products.css";
import "./products/product-score.css";
import "./pointer-light.css";
import "./editorial-workspaces.css";
import "./products/receipt-interactions.css";
import "./interaction-polish.css";
import PointerLight from "./components/pointer-light";
import SiteNavigation from "./components/site-navigation";
import SiteFooter from "./components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "DecisionLab — Before you buy", template: "%s | DecisionLab" },
  description: "Before you buy it, see what it will really cost. Compare product ownership, usage, resale value, and the goals a purchase may delay.",
  authors: [{ name: "Berke Bahar" }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('decisionlab.theme.v1');document.documentElement.dataset.theme=t==='dark'||t==='light'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})();` }} /></head>
      <body className="min-h-full flex flex-col" id="top">
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteNavigation />
        <main id="main" tabIndex={-1}>{children}</main>
        <SiteFooter />
        <PointerLight />
      </body>
    </html>
  );
}
