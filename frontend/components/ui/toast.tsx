"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error" | "info";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // milliseconds
  /** Optional link rendered as a call-to-action, e.g. a block explorer URL. */
  action?: { label: string; href: string };
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
    const id = crypto.randomUUID();
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
              "group bg-popover text-popover-foreground border shadow-lg rounded-lg p-4 data-[state=open]:animate-slide-in data-[state=closed]:animate-hide flex items-start gap-3 w-[320px]",
              {
                "border-primary/50": t.variant === "info",
                "border-success/50": t.variant === "success",
                "border-destructive/50": t.variant === "error",
                "border-border": !t.variant || t.variant === "default",
              }
            )}
            onOpenChange={(open: boolean) => {
              if (!open) removeToast(t.id);
            }}
          >
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm font-medium">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="text-sm text-muted-foreground mt-1 break-words">
                  {t.description}
                </ToastPrimitive.Description>
              )}
              {t.action && (
                <ToastPrimitive.Action altText={t.action.label} asChild>
                  <a
                    href={t.action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {t.action.label}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </ToastPrimitive.Action>
              )}
            </div>
            <ToastPrimitive.Close asChild>
              <button className="text-muted-foreground hover:text-foreground shrink-0">
                <span className="sr-only">Close</span>✕
              </button>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[320px] max-w-full" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
