import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dodací systém — Tropic",
    short_name: "Tropic",
    description: "Systém pre správu a generovanie dodacích listov",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f4ee",
    theme_color: "#e5950f",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
