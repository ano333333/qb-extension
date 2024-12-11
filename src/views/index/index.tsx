import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../tailwind.css";
import IndexApp from "./IndexApp.tsx";

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(
		<StrictMode>
			<IndexApp />
		</StrictMode>,
	);
}
