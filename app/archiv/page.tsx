"use client";

import { ToastProvider } from "../_components/Toast";
import ErrorBoundary from "../_components/ErrorBoundary";
import ArchiveView from "../_components/ArchiveView";

export default function ArchivPage() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ArchiveView />
      </ToastProvider>
    </ErrorBoundary>
  );
}
