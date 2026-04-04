import type { Metadata } from "next";
import { Poppins, Space_Grotesk } from "next/font/google";

import { SiteHeader } from "@/src/components/layout/site-header";

import "./globals.css";

const bodyFont = Poppins({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CMRIT Vault",
  description: "Academic resource platform for students, faculty, and admins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
