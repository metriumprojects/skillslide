import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FAF9F6] p-4 text-center">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200/80 p-8 shadow-sm flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <AlertCircle size={28} />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Session Inactive or Page Refreshed
            </h2>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Your session timed out or a temporary connection issue occurred while inactive.
              Please refresh to continue where you left off.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-neutral-800 transition shadow-sm cursor-pointer"
              >
                <RefreshCw size={16} />
                Refresh Page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
              >
                <Home size={16} />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
