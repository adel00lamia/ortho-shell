import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  featureName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.featureName || 'feature'}:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-3 max-w-sm">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto" />
            <h3 className="font-semibold text-foreground">
              {this.props.featureName
                ? `Error loading ${this.props.featureName}`
                : 'Something went wrong'}
            </h3>
            <p className="text-sm text-muted-foreground">
              This section encountered an error. The rest of the app still works.
            </p>
            <Button size="sm" onClick={this.handleRetry}>
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
