"use client";
import "./globals.css";
import { ReactNode } from "react";
import NextAuthSessionProvider from "./SessionProvider";
import { TimerProvider } from "./contexts/TimerContext";
import Header from "./components/Header";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NextAuthSessionProvider>
          <TimerProvider>
            <Header />
            {children}
          </TimerProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
