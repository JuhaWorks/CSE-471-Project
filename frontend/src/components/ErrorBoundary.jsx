import React from 'react';
import * as Sentry from '@sentry/react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        Sentry.captureException(error, { extra: errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // Elegant, polite Fallback UI
            return (
                <div className="w-full h-full flex items-center justify-center p-6 bg-white/[0.02] border border-white/[0.05] rounded-xl text-center min-h-[300px]">
                    <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-rose-500/10 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Something went wrong.</h3>
                            <p className="text-gray-400 text-sm max-w-sm mx-auto">
                                We're sorry, but this component encountered an unexpected error. Our team has been notified.
                            </p>
                        </div>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-4 py-2 mt-2 bg-white/[0.05] hover:bg-white/[0.1] text-white text-sm font-medium rounded-lg transition-colors border border-white/[0.1]"
                        >
                            Try Reloading
                        </button>
                    </div>
                </div>
            );
        }

        // Render children normally if no error
        return this.props.children;
    }
}

export default ErrorBoundary;
