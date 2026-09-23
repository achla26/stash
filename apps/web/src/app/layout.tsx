import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { SWRegister } from "@/components/pwa/sw-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#007AFF",
};

export const metadata: Metadata = {
  title: "Stash - Your learning links & notes",
  description: "Save learning links, notes, notebooks and pads — sab ek jagah.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stash",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function() {
            try {
              var theme = localStorage.getItem('theme') || 'system';
              var resolved = theme;
              if (theme === 'system') {
                resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              document.documentElement.classList.add(resolved);
            } catch (e) {
              document.documentElement.classList.add('dark');
            }
          })();`}
        </Script>
        <SWRegister />
        <ThemeProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>

        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "bg-card border border-border text-foreground text-sm font-medium shadow-lg",
              description: "text-muted-foreground text-xs",
              actionButton: "bg-primary text-primary-foreground text-xs font-medium",
              cancelButton: "bg-surface-muted text-muted-foreground text-xs font-medium",
              error: "border-destructive/30 bg-destructive/5 text-destructive",
              success: "border-success/30 bg-success/5 text-success",
              warning: "border-warning/30 bg-warning/5 text-warning",
            },
          }}
        />

        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  );
}