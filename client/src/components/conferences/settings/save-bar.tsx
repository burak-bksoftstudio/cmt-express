
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Save, Loader2, AlertCircle, RotateCcw } from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface SaveBarProps {
  isDirty: boolean;
  isSaving: boolean;
  disabled?: boolean;
  onSave: () => void;
  onReset: () => void;
  label?: string;
  help?: string;
  resetLabel?: string;
  saveLabel?: string;
  savingLabel?: string;
}

export function SaveBar({
  isDirty,
  isSaving,
  disabled = false,
  onSave,
  onReset,
  label,
  help,
  resetLabel,
  saveLabel,
  savingLabel,
}: SaveBarProps) {
  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.4, ease: appleEasing }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          {/* Blur background */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t" />
          
          {/* Content */}
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Info */}
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
                >
                  <AlertCircle className="h-5 w-5 text-primary" />
                </motion.div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {help}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  disabled={isSaving}
                  className="hidden sm:flex"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {resetLabel}
                </Button>
                <Button
                  onClick={onSave}
                  disabled={disabled || isSaving}
                  className="min-w-[120px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {savingLabel}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {saveLabel}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

