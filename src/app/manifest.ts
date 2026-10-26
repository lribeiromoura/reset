import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Reset — pequenos passos, novos ritmos",
    short_name: "Reset",
    description: "Organize hábitos e acompanhe seu progresso com leveza.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f8f3",
    theme_color: "#f7f8f3",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
