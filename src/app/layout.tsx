"use client";
import "./globals.css";
import { ReactNode } from "react";
import NextAuthSessionProvider from "./SessionProvider";
import Header from "./components/Header";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NextAuthSessionProvider>
          <Header />
        {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
