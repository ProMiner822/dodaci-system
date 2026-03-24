import DeliveryForm from "./_components/DeliveryForm";
import { ToastProvider } from "./_components/Toast";

export default function Page() {
  return (
    <ToastProvider>
      <DeliveryForm />
    </ToastProvider>
  );
}
