import React from "react";

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
  info?: React.ErrorInfo;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, info });
    try {
      // eslint-disable-next-line no-console
      console.error("Runtime error captured by ErrorBoundary:", error, info);
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{
            maxWidth: 900,
            margin: '40px auto',
            background: '#0f172a',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <strong style={{ color: '#67e8f9' }}>Something went wrong</strong>
            </div>
            <div style={{ padding: 20 }}>
              {this.state.error && (
                <>
                  <div style={{ marginBottom: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#fecaca' }}>
                    {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <pre style={{
                      margin: 0,
                      padding: 12,
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 8,
                      overflowX: 'auto',
                      fontSize: 12,
                      lineHeight: 1.5
                    }}>{this.state.error.stack}</pre>
                  )}
                </>
              )}
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => window.location.reload()} style={{
                  background: '#06b6d4',
                  color: '#06131a',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>Reload</button>
                <button onClick={() => this.setState({ hasError: false, error: undefined, info: undefined })} style={{
                  background: 'transparent',
                  color: '#93c5fd',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}>Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Optional: surface unhandled errors in console for quicker diagnosis
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    try { console.error('[window.onerror]', e.message, e.error); } catch {}
  });
  window.addEventListener('unhandledrejection', (e) => {
    try { console.error('[window.unhandledrejection]', e.reason); } catch {}
  });
}
