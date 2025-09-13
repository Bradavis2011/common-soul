import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { analytics } from '@/services/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown';
    
    analytics.trackError(error, `ErrorBoundary_${errorId}`);
    
    console.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ errorInfo });
    this.sendErrorToMonitoring(error, errorInfo, errorId);
  }

  private sendErrorToMonitoring(error: Error, errorInfo: ErrorInfo, errorId: string) {
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: localStorage.getItem('userId') || 'anonymous'
    };

    console.log('Error Report:', errorReport);
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });

    analytics.trackUserAction('error_retry', {
      error_id: this.state.errorId,
      error_message: this.state.error?.message
    });
  };

  private handleGoHome = () => {
    analytics.trackUserAction('error_go_home', {
      error_id: this.state.errorId,
      error_message: this.state.error?.message
    });

    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <p className="text-muted-foreground">
                We apologize for the inconvenience. An unexpected error occurred while loading this page.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-semibold text-sm mb-2">Error Details (Development Only):</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Error:</strong> {this.state.error?.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Error ID:</strong> {this.state.errorId}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="default"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  If this problem persists, please{' '}
                  <a
                    href="/contact"
                    className="text-primary hover:underline"
                    onClick={() => analytics.trackUserAction('error_contact_support', {
                      error_id: this.state.errorId
                    })}
                  >
                    contact our support team
                  </a>
                  {this.state.errorId && (
                    <>
                      {' '}and reference error ID: <code className="text-xs">{this.state.errorId}</code>
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error('Unhandled error:', error, context);
    analytics.trackError(error, context || 'useErrorHandler');
  };

  return { handleError };
};

export const setupGlobalErrorHandling = () => {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    analytics.trackError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      'unhandledrejection'
    );
  });

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    analytics.trackError(
      event.error || new Error(event.message),
      'global_error'
    );
  });

  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      const target = event.target as HTMLElement;
      console.error('Resource loading error:', target.tagName, target);
      analytics.trackError(
        new Error(`Failed to load resource: ${target.tagName}`),
        'resource_error'
      );
    }
  }, true);
};

export default ErrorBoundary;