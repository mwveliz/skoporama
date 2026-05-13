import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skoporama — Teclado por Mirada",
  description:
    "Teclado virtual controlado por la mirada para personas con parálisis. Escribe y habla usando solo tus ojos. Gratuito, sin hardware especial.",
  keywords: [
    "eye tracking",
    "gaze keyboard",
    "AAC",
    "accessibility",
    "paralysis",
    "virtual keyboard",
    "text to speech",
    "augmentative communication",
  ],
  openGraph: {
    title: "Skoporama — Teclado por Mirada",
    description:
      "Escribe y habla usando solo tus ojos. Un teclado virtual gratuito para personas con parálisis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
