// Lightweight helper to lazily load Pyodide in the browser.
// Uses jsDelivr CDN. Returns the Pyodide instance.
export async function getPyodideInstance(): Promise<any> {
  // @ts-ignore
  if (typeof window !== "undefined" && (window as any).pyodide) {
    // @ts-ignore
    return (window as any).pyodide;
  }

  // Inject pyodide script if needed
  // @ts-ignore
  if (typeof window !== "undefined" && !(window as any).loadPyodide) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
      script.onload = () => resolve();
      script.onerror = (e) => reject(new Error("Failed to load Pyodide script"));
      document.head.appendChild(script);
    });
  }

  // @ts-ignore
  const pyodide = await (window as any).loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/" });
  // @ts-ignore
  (window as any).pyodide = pyodide;
  return pyodide;
}
