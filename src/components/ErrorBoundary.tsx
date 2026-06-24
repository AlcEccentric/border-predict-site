import React from 'react';
import { log } from '../utils/logger';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

/**
 * Top-level error boundary. Catches render/runtime errors anywhere in the
 * tree (e.g. a chart component throwing on malformed data) and shows a
 * friendly fallback instead of a blank white screen.
 *
 * Must be a class component — React only supports error boundaries via the
 * `getDerivedStateFromError` / `componentDidCatch` lifecycle.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Surfaced only in debug builds; no-op in production (see logger).
        log.error('Uncaught error in component tree:', error, info.componentStack);
    }

    private handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center p-4">
                    <div className="bg-base-200 rounded-lg shadow-lg p-8 max-w-md text-center">
                        <h2 className="text-xl font-bold mb-4">エラーが発生しました</h2>
                        <p className="mb-2">予期しない問題が発生し、ページを表示できませんでした。</p>
                        <p className="text-base-content/70 mb-6">
                            恐れ入りますが、再読み込みをお試しください。
                        </p>
                        <button className="btn btn-primary" onClick={this.handleReload}>
                            もう一度読み込む
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
