import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AvenBrief",
    short_name: "AvenBrief",
    description: "The world, made clear.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f2342",
    icons: [
      {
        src: "/icon.png?v=3",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
