import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-screen p-8">
          <div className="max-w-lg w-full text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
            <pre className="text-left text-sm bg-red-50 border border-red-200 rounded p-4 overflow-auto max-h-48 text-red-800">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
