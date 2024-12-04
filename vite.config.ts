import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json" assert { type: "json" };
import tailwindcss from "tailwindcss";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), crx({ manifest })],
	css: {
		postcss: {
			plugins: [tailwindcss],
		},
	},
});
