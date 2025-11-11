import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/context/Providers";
import { ToastProvider } from "@/context/ToastContext";
import CallManager from "@/components/calls/CallManager";
import RealTimeNotifications from "@/components/notifications/RealTimeNotifications";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "sonner";
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
  title: "FriendFinder - Connect with People Nearby",
  description:
    "Discover and connect with people physically nearby using GPS, WiFi, and Bluetooth technology.",
  keywords: [
    "social networking",
    "nearby friends",
    "location-based",
    "real-time chat",
  ],
  authors: [{ name: "FriendFinder Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Cache busting for development */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
            <meta httpEquiv="Pragma" content="no-cache" />
            <meta httpEquiv="Expires" content="0" />
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>
          <ToastProvider>
            <ErrorBoundary>
              <div id="root" className="min-h-screen">
                {children}
              </div>
            </ErrorBoundary>
            <CallManager />
            <RealTimeNotifications />
            <div id="portal-root" />
            <Toaster position="top-right" richColors />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
