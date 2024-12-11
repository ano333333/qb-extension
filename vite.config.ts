import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "tailwindcss";
import manifest from "./manifest.config";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), crx({ manifest })],
	css: {
		postcss: {
			plugins: [tailwindcss],
		},
	},
	build: {
		rollupOptions: {
			input: {
				popup: "popup.html",
				index: "index.html",
			},
			output: {
				entryFileNames: "[name].js",
			},
		},
	},
});
