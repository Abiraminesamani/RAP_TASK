import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PPE Safety AI | Construction Site Safety Intelligence",
  description:
    "Detect PPE compliance and ask natural-language questions about construction-site images using RT-DETR and evidence-based reasoning.",
  keywords: [
    "PPE Detection",
    "Construction Safety",
    "RT-DETR",
    "Computer Vision",
    "Safety Intelligence",
    "OSHA Compliance",
  ],
  authors: [{ name: "Safety AI Engineering" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${inter.variable} font-sans min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950 flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
