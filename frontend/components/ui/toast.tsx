'use client';

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { v4 as uuid } from "uuid";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error" | "info";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // milliseconds
}

interface InternalToast extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<InternalToast[]>([]);

  const addToast = React.useCallback((options: ToastOptions) => {
    const id = uuid();
    setToasts((prev) => [...prev, { id, ...options }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <ToastPrimitive.Provider swipeDirection="right">
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            duration={t.duration ?? 5000}
            role="alert"
            aria-live="polite"
            className={cn(
              "group bg-white dark:bg-zinc-900 border shadow-lg rounded-md p-4 data-[state=open]:animate-slide-in data-[state=closed]:animate-hide flex items-start gap-3 w-[320px]",
              {
                "border-blue-500": t.variant === "info",
                "border-green-500": t.variant === "success",
                "border-red-500": t.variant === "error",
                "border-zinc-200 dark:border-zinc-800":
                  !t.variant || t.variant === "default",
              }
            )}
            onOpenChange={(open) => {
              if (!open) removeToast(t.id);
            }}
          >
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm font-medium">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close asChild>
              <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <span className="sr-only">Close</span>
                ✕
              </button>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[320px] max-w-full" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context)
    throw new Error("useToast must be used within a ToastProvider");
  return context;
}
