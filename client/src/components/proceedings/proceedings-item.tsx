
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSimpleToast } from "@/components/ui/toast";
import { AcceptedPaper } from "@/lib/api";
import { BibtexModal } from "./bibtex-modal";
import {
  FileText,
  Download,
  Copy,
  Users,
  Tag,
  ExternalLink,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface ProceedingsItemProps {
  paper: AcceptedPaper;
  index: number;
}

export function ProceedingsItem({ paper, index }: ProceedingsItemProps) {
  const { addToast, ToastRenderer } = useSimpleToast();
  const [bibtexModalOpen, setBibtexModalOpen] = useState(false);

  const handleCopyBibtex = async () => {
    try {
      await navigator.clipboard.writeText(paper.bibtex);
      addToast({
        type: "success",
        title: "Kopyalandı!",
        description: "BibTeX kaydı panoya kopyalandı.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Kopyalama Başarısız",
        description: "BibTeX kopyalanamadı.",
      });
    }
  };

  const handleDownloadPdf = () => {
    if (paper.finalPdfUrl) {
      window.open(paper.finalPdfUrl, "_blank");
    }
  };

  return (
    <>
      <ToastRenderer />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing, delay: index * 0.05 }}
      >
        <Card className="group transition-all hover:shadow-md hover:border-primary/20">
          <CardContent className="p-5">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors">
                  {paper.title}
                </h3>
              </div>

              {/* Authors */}
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="line-clamp-2">{paper.authors.join(", ")}</p>
              </div>

              {/* Track & Keywords */}
              <div className="flex flex-wrap items-center gap-2">
                {paper.track && (
                  <Badge variant="secondary" className="text-xs">
                    <Tag className="mr-1 h-3 w-3" />
                    {paper.track}
                  </Badge>
                )}
                {paper.keywords.slice(0, 3).map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {keyword}
                  </Badge>
                ))}
                {paper.keywords.length > 3 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{paper.keywords.length - 3}
                  </Badge>
                )}
              </div>

              {/* Abstract Preview */}
              {paper.abstract && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {paper.abstract}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                {paper.finalPdfUrl ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleDownloadPdf}
                    className="gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    PDF yok
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyBibtex}
                  className="gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  BibTeX
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBibtexModalOpen(true)}
                  className="gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Görüntüle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* BibTeX Modal */}
      <BibtexModal
        open={bibtexModalOpen}
        onOpenChange={setBibtexModalOpen}
        title={paper.title}
        bibtex={paper.bibtex}
      />
    </>
  );
}

