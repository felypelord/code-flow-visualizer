import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "@/components/error-boundary";
import { initGA, initFBPixel } from "@/lib/analytics";
import { initI18n } from "@/i18n/i18n";
import "./index.css";

// Initialize analytics
initGA();
initFBPixel();
initI18n();

createRoot(document.getElementById("root")!).render(
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
);
