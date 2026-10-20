import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  isolate?: boolean; // If true, renders a compact card instead of full-screen
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught an unhandled exception:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleClearCacheAndReload = () => {
    try {
      // Clear non-critical app caches that may have corrupted state
      const keysToKeep = ['college_profile', 'erp_session'];
      const preserved: Record<string, string | null> = {};
      keysToKeep.forEach(k => {
        preserved[k] = localStorage.getItem(k);
      });
      localStorage.clear();
      keysToKeep.forEach(k => {
        if (preserved[k]) localStorage.setItem(k, preserved[k]!);
      });
    } catch (e) {
      console.warn('Could not reset cache:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.isolate) {
        // Compact isolated widget error boundary
        return (
          <div className="p-4 my-3 bg-red-50 border border-red-200 rounded-xl text-red-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold">
                {this.props.fallbackTitle || 'Component could not be rendered'}
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                {this.props.fallbackMessage ||
                  'An unexpected render issue occurred. Your data is safe.'}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-1 shadow-sm"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        );
      }

      // Full application / page level error boundary
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight">
              {this.props.fallbackTitle || 'Application Error Shield'}
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              {this.props.fallbackMessage ||
                'The system encountered an unexpected UI exception, but prevented the application from terminating. Session data and financial records remain intact.'}
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-red-400 overflow-x-auto max-h-24">
                {this.state.error.message || 'Unknown Exception'}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors inline-flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                title="Clears corrupted temporary client storage and refreshes"
              >
                <Home className="w-4 h-4" />
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
