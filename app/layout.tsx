import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIG SPPG & Sekolah Negeri - Sumbersari Jember",
  description: "Sistem Informasi Geografis Pemetaan dan Analisis Cakupan Satuan Pelayanan Gizi (SPPG) terhadap Sekolah Negeri di Kecamatan Sumbersari, Jember menggunakan PostGIS dan pgRouting.",
  keywords: [
    "SIG",
    "GIS",
    "SPPG",
    "Sekolah Negeri",
    "Sumbersari",
    "Jember",
    "PostGIS",
    "pgRouting",
    "Pemetaan Spasial",
    "Geographic Information System",
    "Analisis Cakupan",
    "Dijkstra pgRouting"
  ],
  authors: [{ name: "Tsaqif Radhitya", url: "https://github.com/TsaqifRadhitya" }],
  creator: "Tsaqif Radhitya",
  publisher: "Tsaqif Radhitya",
  openGraph: {
    title: "SIG SPPG & Sekolah Negeri - Sumbersari Jember",
    description: "Sistem Informasi Geografis Pemetaan dan Analisis Cakupan Satuan Pelayanan Gizi (SPPG) terhadap Sekolah Negeri di Kecamatan Sumbersari, Jember.",
    url: "http://localhost:3000",
    siteName: "SIG SPPG Sumbersari",
    locale: "id_ID",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1C322D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
