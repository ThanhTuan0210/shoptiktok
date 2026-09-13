import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in component tree:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/shop";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center shadow-2xl animate-fade-in">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Đã xảy ra sự cố hiển thị</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Trang web gặp trục trặc tạm thời khi tải thành phần này. Dữ liệu của bạn vẫn an toàn và không bị ảnh hưởng.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-gray-950/80 rounded-xl border border-gray-800/80 text-left">
                <p className="text-xs text-rose-400 font-mono line-clamp-2">
                  {this.state.error.message || "Lỗi giao diện không xác định"}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 btn btn-primary flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Tải lại trang
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-secondary flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium"
              >
                <Home className="w-4 h-4" />
                Về cửa hàng
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
