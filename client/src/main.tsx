import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "@/components/error-boundary";
import { initGA, initFBPixel } from "@/lib/analytics";
import "./index.css";

// Initialize analytics
initGA();
initFBPixel();

createRoot(document.getElementById("root")!).render(
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
);
