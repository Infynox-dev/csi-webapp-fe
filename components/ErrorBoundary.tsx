import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui';
import { isChunkLoadError, reloadOnChunkError } from '../utils/chunkLoadError';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    if (reloadOnChunkError(error)) {
      return;
    }
    void import('@sentry/react').then((Sentry) => {
      Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }).catch(() => {
      /* Sentry optional when DSN unset */
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center border-t-4 border-red-500">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-6">
              {isChunkLoadError(this.state.error)
                ? 'A new version of the app was deployed. Please reload to continue.'
                : 'We encountered an unexpected error. Our engineering team has been notified.'}
            </p>
            <div className="bg-gray-100 p-4 rounded text-left mb-6 overflow-auto max-h-32 text-xs text-red-800 font-mono">
                {this.state.error?.message}
            </div>
            <Button onClick={this.handleReload} variant="primary" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
