import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { content } from "./src/content/content";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "person-schema",
      transformIndexHtml: () => [
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: content.name,
            jobTitle: content.role,
            url: "https://aungkhantkyaw.com/",
            email: content.email,
            telephone: content.phone,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Bangkok",
              addressCountry: "TH",
            },
            sameAs: [content.linkedin],
          }),
        },
      ],
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three/")) return "three";
          if (
            /node_modules\/(?:@react-three|@react-spring|three-stdlib)/.test(id)
          )
            return "scene-vendor";
          if (id.includes("node_modules/postprocessing/"))
            return "postprocessing";
        },
      },
    },
  },
});
