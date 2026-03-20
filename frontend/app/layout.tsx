import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "NewsFlow — Personalized News Aggregator",
  description:
    "Stay informed with AI-scored, personalized news from hundreds of sources. Built for curious minds.",
  openGraph: {
    title: "NewsFlow",
    description: "Your personalized news feed",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
