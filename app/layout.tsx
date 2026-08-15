import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upkeep — Estate maintenance",
  description: "Maintenance requests across care homes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas text-body">{children}</body>
    </html>
  );
}
