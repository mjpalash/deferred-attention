import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deferred Attention",
  description: "Save it for later, with zero friction."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
