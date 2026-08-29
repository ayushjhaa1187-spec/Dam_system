import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-hc-bg text-hc-ink flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-hc-surface border border-hc-border rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-950 text-hc-critical border border-red-800 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-hc-ink">Application Error Recovered</h2>
            <p className="text-xs text-hc-textSecondary">
              A runtime component error occurred. Click below to reload and restore normal operation.
            </p>
            {this.state.error && (
              <div className="bg-hc-bg p-3 rounded-lg border border-hc-border text-left overflow-x-auto text-[11px] font-mono text-hc-critical">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 rounded-xl bg-hc-active hover:bg-hc-active text-slate-950 text-xs font-bold transition flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
