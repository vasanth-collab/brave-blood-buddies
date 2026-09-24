// =============================================
// ERROR BOUNDARY — catches unexpected crashes
//
// Normally React shows a blank white page if any
// component throws. This wrapper instead shows a
// friendly message with a "Reload" button.
// =============================================

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Droplets, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  // React calls this when a child component crashes
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center">
            <Droplets className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground max-w-sm">
            The app hit an unexpected error. Reloading usually fixes it.
          </p>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Reload App
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
