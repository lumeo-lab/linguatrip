import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LinguaTrip — Ucz się języków, podróżując po świecie",
  description:
    "Przeglądarkowa gra fabularna do nauki języków obcych. Wciel się w podróżnika i naucz się angielskiego przez życiowe scenariusze w Londynie.",
  openGraph: {
    title: "LinguaTrip",
    description: "Gra RPG do nauki języków obcych dla Polaków",
    siteName: "LinguaTrip",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
