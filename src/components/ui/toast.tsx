"use client";

import { useToast, Toast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastComponent({ toast }: { toast: Toast }) {
  const baseClasses = "p-4 rounded-lg shadow-lg border max-w-sm";
  const variantClasses = toast.variant === "destructive" 
    ? "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/10 dark:border-red-800 dark:text-red-100"
    : "bg-white border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100";

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      {toast.title && (
        <div className="font-semibold text-sm mb-1">{toast.title}</div>
      )}
      {toast.description && (
        <div className="text-sm opacity-90">{toast.description}</div>
      )}
    </div>
  );
}