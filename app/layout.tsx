import type { Metadata } from "next";
import { CookieConsent } from "@/components/CookieConsent";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ProfileMenu } from "@/components/ProfileMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Court Inside | Daily Basketball Games",
    template: "%s | Court Inside",
  },
  description: "Minijuegos diarios de baloncesto con retos de estadísticas, memoria NBA y cultura hoops.",
  keywords: ["basketball games", "NBA trivia", "daily basketball games", "Court Inside"],
  openGraph: {
    title: "Court Inside",
    description: "Daily basketball games for hoops fans.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col"><LanguageProvider>{children}<ProfileMenu /><CookieConsent /></LanguageProvider></body>
    </html>
  );
}
