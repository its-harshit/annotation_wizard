"use client";
import "./globals.css";
import { ReactNode } from "react";
import NextAuthSessionProvider from "./SessionProvider";
import { TimerProvider } from "./contexts/TimerContext";
import Header from "./components/Header";
import { useZoom } from "./hooks/useZoom";

export default function RootLayout({ children }: { children: ReactNode }) {
  // Set zoom to 90% on app load
  useZoom(0.9);

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
