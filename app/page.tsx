import DeliveryForm from "./_components/DeliveryForm";
import { ToastProvider } from "./_components/Toast";
import ErrorBoundary from "./_components/ErrorBoundary";

export default function Page() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <DeliveryForm />
      </ToastProvider>
    </ErrorBoundary>
  );
}
