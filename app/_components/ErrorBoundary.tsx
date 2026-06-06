"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
          <div className="w-full max-w-sm p-6 text-center">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              Niečo sa pokazilo
            </h1>
            <p className="mt-2 text-sm text-muted">
              Skúste obnoviť stránku. Ak problém pretrváva, kontaktujte podporu.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded bg-accent px-3 py-2.5 text-base font-bold text-accent-ink transition-colors hover:bg-accent-hover active:scale-[0.98]"
            >
              Obnoviť stránku
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
