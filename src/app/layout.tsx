import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Becraft | SMK Lugina Rancaekek",
    template: "%s | Becraft",
  },
  description:
    "Becraft — Digital Portfolio & Assessment System untuk SMK Lugina Rancaekek. Ikuti acara, kumpulkan karya, dan bangun portofolio.",
  applicationName: "Becraft",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
