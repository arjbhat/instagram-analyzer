"use client";

import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

const toasts: Toast[] = [];
const listeners: Array<(toasts: Toast[]) => void> = [];

let toastIdCounter = 0;

function dispatch(toasts: Toast[]) {
  listeners.forEach((listener) => listener(toasts));
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>(toasts);

  const toast = useCallback(({ title, description, variant = "default" }: Omit<Toast, "id">) => {
    const id = (++toastIdCounter).toString();
    const newToast: Toast = { id, title, description, variant };
    
    toasts.push(newToast);
    dispatch([...toasts]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      const index = toasts.findIndex((t) => t.id === id);
      if (index > -1) {
        toasts.splice(index, 1);
        dispatch([...toasts]);
      }
    }, 5000);

    return id;
  }, []);

  // Subscribe to toast changes
  useState(() => {
    const listener = (newToasts: Toast[]) => setToastList(newToasts);
    listeners.push(listener);
    
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  });

  return { toast, toasts: toastList };
}