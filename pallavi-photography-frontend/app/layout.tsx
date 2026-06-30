import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pallavi Photography | Portrait & Family Photography Switzerland",
  description: "High-end portrait, newborn, family, maternity, and fine art photography based in Switzerland. Capture your special moments with elegant, optimized galleries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FCFAF7] text-[#2C2623] font-sans selection:bg-[#EAE4DC] selection:text-[#352F2C]">
        {children}
      </body>
    </html>
  );
}
