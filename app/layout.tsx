import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://skynamecat.github.io"),
  title: "skynamecat — 数字世界里的安静角落",
  description: "skynamecat 的个人主页：想法、创造，以及一些不急着抵达的探索。",
  openGraph: {
    title: "skynamecat — 数字世界里的安静角落",
    description: "想法、创造，以及一些不急着抵达的探索。",
    images: [{ url: "/og.png", width: 1792, height: 900, alt: "skynamecat 的安静数字角落" }],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "skynamecat — 数字世界里的安静角落",
    description: "想法、创造，以及一些不急着抵达的探索。",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var mode = localStorage.getItem("sky-display-mode");
            document.documentElement.dataset.displayMode = mode === "minimal" ? "minimal" : "standard";
          } catch (_) {
            document.documentElement.dataset.displayMode = "standard";
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
