import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dodací systém | Tropic",
  description:
    "Systém pre správu a generovanie dodacích listov. Vytvárajte, podpisujte a odosielaj te dodacie listy elektronicky.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
