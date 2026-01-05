/**
 * Backwards compatibility wrapper for useSimpleToast
 * Maps the old toast API to the new shadcn/ui toast system
 */

import { useCallback } from "react";
import { useToast, toast as shadcnToast } from "@/hooks/use-toast";

export type ToastType = "success" | "error" | "warning" | "info";

interface OldToastOptions {
  type: ToastType;
  title: string;
  description?: string;
}

export function useSimpleToast() {
  const { toast } = useToast();

  const addToast = useCallback((options: OldToastOptions) => {
    toast({
      title: options.title,
      description: options.description,
      variant: options.type === "error" ? "destructive" : "default",
    });
  }, [toast]);

  const removeToast = useCallback((_id: string) => {
    // Not needed with shadcn/ui toast - toasts auto-dismiss
  }, []);

  // No longer needed - Toaster component in App.tsx handles rendering
  const ToastRenderer = useCallback(() => null, []);

  return { addToast, removeToast, ToastRenderer };
}

// Also export a standalone toast function
export function simpleToast(options: OldToastOptions) {
  shadcnToast({
    title: options.title,
    description: options.description,
    variant: options.type === "error" ? "destructive" : "default",
  });
}
