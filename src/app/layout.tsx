import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
