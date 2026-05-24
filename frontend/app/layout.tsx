import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
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
  title: "Token Streaming - Stream tokens over time",
  description: "Stream STX and SIP-010 tokens with vesting, pause/resume, and more on Stacks blockchain",
  other: {
    "talentapp:project_verification":
      "f00fb6cbe5c51de93c58e710bf6eb69002bba2b18385b3f8cfd41b01deeb312fb4740cc5d4cd7e632fdca3926619bed3f85555b6e4c823176ab2735dee10befb",
  },
};

// Prevent SSR for this layout since we use browser-only libraries
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
