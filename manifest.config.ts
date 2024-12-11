import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "./package.json";
const { version } = packageJson;

export default defineManifest(async (env) => ({
	manifest_version: 3,
	name: env.mode === "production" ? "qb-extension" : `qb-extension-${env.mode}`,
	version,
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
}));
