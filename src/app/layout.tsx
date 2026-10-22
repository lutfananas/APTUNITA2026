import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lembar Kerja Akreditasi APT UNITA 2026",
  description:
    "Lembar kerja persiapan LED dan LKPT Universitas Tulungagung menuju Terakreditasi Unggul — IAPT 4.1 (BAN-PT No. 35/2025). Isian tim tersimpan aman di database terpusat.",
  keywords: ["akreditasi", "BAN-PT", "IAPT", "LED", "LKPT", "Universitas Tulungagung", "SPMI"],
  authors: [{ name: "Pusat Penjaminan Mutu Universitas Tulungagung" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Font desain asli: IBM Plex Sans (body) · Literata (display) · IBM Plex Mono (kode) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&family=Literata:opsz,wght@7..72,400;7..72,500&display=swap"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
