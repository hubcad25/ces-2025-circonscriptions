import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages serves the site under the repository name.
export default defineConfig({
  base: "/ces-2025-circonscriptions/",
  plugins: [react()],
});
