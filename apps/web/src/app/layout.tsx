import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from 'next-themes';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Othello Game",
  description: "A real-time multiplayer Othello game built with Next.js and Socket.IO",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
