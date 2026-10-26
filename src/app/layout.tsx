import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/features/pwa/ui/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reset — pequenos passos, novos ritmos",
  description:
    "Transforme suas intenções em pequenas ações diárias e acompanhe seu progresso com leveza.",
  applicationName: "Reset",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Reset" },
  icons: {
    icon: [
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}<ServiceWorkerRegistration /></body>
    </html>
  );
}
