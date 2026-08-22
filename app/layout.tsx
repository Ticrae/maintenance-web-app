import type { Metadata } from "next";
import "./globals.css";
import { getServerLocale } from "@/lib/i18n/server";
import { LanguageProvider } from "@/lib/i18n/language-provider";
import { LanguageToggle } from "@/components/language-toggle";

export const metadata: Metadata = {
  title: "FixNest",
  description: "Maintenance requests across homes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas text-body">
        <LanguageProvider initialLocale={locale}>
          {children}
          <LanguageToggle />
        </LanguageProvider>
      </body>
    </html>
  );
}
