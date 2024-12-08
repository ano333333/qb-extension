import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx, type ManifestV3Export } from "@crxjs/vite-plugin";
import tailwindcss from "tailwindcss";

const extensionName =
	process.env.ENV === "production"
		? "qb-extension"
		: `qb-extension-${process.env.ENV}`;
const manifest: ManifestV3Export = {
	manifest_version: 3,
	name: extensionName,
	version: "1.0.0",
	action: {
		default_popup: "popup.html",
	},
	permissions: ["storage"],
	content_scripts: [
		{
			matches: ["https://qb.medilink-study.com/Answer/*"],
			js: ["src/views/qbAnswerContent/content.tsx"],
		},
	],
};

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
