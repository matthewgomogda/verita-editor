import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notion-Style Editor Prototype",
  description: "Rapid replication: block editor + slash menu + hover controls"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900">{children}</body>
    </html>
  );
}
