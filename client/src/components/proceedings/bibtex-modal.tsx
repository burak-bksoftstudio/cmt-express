
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSimpleToast } from "@/components/ui/toast";
import { Copy, CheckCircle, FileText } from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface BibtexModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  bibtex: string;
}

export function BibtexModal({ open, onOpenChange, title, bibtex }: BibtexModalProps) {
  const { addToast, ToastRenderer } = useSimpleToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bibtex);
      setCopied(true);
      addToast({
        type: "success",
        title: "Kopyalandı!",
        description: "BibTeX kaydı panoya kopyalandı.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      addToast({
        type: "error",
        title: "Kopyalama Başarısız",
        description: "BibTeX kopyalanamadı.",
      });
    }
  };

  return (
    <>
      <ToastRenderer />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: appleEasing }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                BibTeX Kaydı
              </DialogTitle>
              <DialogDescription className="line-clamp-2">
                {title}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="relative">
                <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto font-mono leading-relaxed max-h-[300px] overflow-y-auto">
                  {bibtex}
                </pre>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-2 right-2"
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1.5 h-7"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {copied ? "Kopyalandı" : "Kopyala"}
                  </Button>
                </motion.div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Bu BibTeX kaydını makaleyi LaTeX dokümanlarınızda atıf vermek için kullanın.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Kapat
              </Button>
              <Button onClick={handleCopy} className="gap-2">
                <Copy className="h-4 w-4" />
                Panoya Kopyala
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}

