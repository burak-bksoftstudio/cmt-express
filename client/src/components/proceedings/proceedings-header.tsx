import { t } from "@/lib/i18n";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSimpleToast } from "@/components/ui/toast";
import { proceedingsApi } from "@/lib/api";
import {
  BookOpen,
  Download,
  Copy,
  FileText,
  MoreVertical,
  Loader2,
  Calendar,
  MapPin,
  CheckCircle,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface ProceedingsHeaderProps {
  conference: {
    id: string;
    name: string;
    shortName: string | null;
    year: number;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
  };
  totalPapers: number;
  fullBibtex: string;
  generatedAt: string;
}

export function ProceedingsHeader({
  conference,
  totalPapers,
  fullBibtex,
  generatedAt,
}: ProceedingsHeaderProps) {
  const { addToast, ToastRenderer } = useSimpleToast();
  const [downloading, setDownloading] = useState(false);
  const [downloadingBibtex, setDownloadingBibtex] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await proceedingsApi.getPdf(conference.id);
      const blob = new Blob([response.data], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${conference.shortName || "proceedings"}-${conference.year}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast({
        type: "success",
        title: "İndirme Başladı",
        description: "Bildiri kitapçığı indiriliyor. PDF kaydetmek için Yazdır > PDF olarak kaydet seçin.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "İndirme Başarısız",
        description: "Bildiri kitapçığı indirilemedi. Lütfen tekrar deneyin.",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadBibtex = async () => {
    setDownloadingBibtex(true);
    try {
      const response = await proceedingsApi.getBibtex(conference.id);
      const blob = new Blob([response.data], { type: "application/x-bibtex" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${conference.shortName || "proceedings"}-${conference.year}.bib`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast({
        type: "success",
        title: "İndirme Başladı",
        description: "BibTeX dosyası indiriliyor.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "İndirme Başarısız",
        description: "BibTeX indirilemedi. Lütfen tekrar deneyin.",
      });
    } finally {
      setDownloadingBibtex(false);
    }
  };

  const handleCopyBibtex = async () => {
    try {
      await navigator.clipboard.writeText(fullBibtex);
      addToast({
        type: "success",
        title: "Kopyalandı!",
        description: "Tam BibTeX panoya kopyalandı.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Kopyalama Başarısız",
        description: "BibTeX kopyalanamadı. Lütfen tekrar deneyin.",
      });
    }
  };

  // Format date range
  const formatDateRange = () => {
    if (!conference.startDate && !conference.endDate) return null;
    const start = conference.startDate
      ? new Date(conference.startDate).toLocaleDateString("tr-TR", {
          month: "short",
          day: "numeric",
        })
      : "";
    const end = conference.endDate
      ? new Date(conference.endDate).toLocaleDateString("tr-TR", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";
    return `${start} - ${end}`;
  };

  return (
    <>
      <ToastRenderer />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: appleEasing }}
        className="rounded-xl border bg-linear-to-br from-primary/5 via-background to-primary/10 p-6 dark:from-primary/10 dark:to-primary/5"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Conference Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                  {conference.name}
                </h1>
                {conference.shortName && (
                  <p className="text-lg font-medium text-primary">
                    {conference.shortName} {conference.year}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {formatDateRange() && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateRange()}</span>
                </div>
              )}
              {conference.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{conference.location}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                {totalPapers} Kabul Edilen Makale
              </Badge>
              <span className="text-xs text-muted-foreground">
                Oluşturulma: {new Date(generatedAt).toLocaleString("tr-TR")}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="gap-2"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Bildiri Kitapçığını İndir
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadBibtex} disabled={downloadingBibtex}>
                  <FileText className="mr-2 h-4 w-4" />
                  {downloadingBibtex ? "İndiriliyor..." : "BibTeX İndir"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyBibtex}>
                  <Copy className="mr-2 h-4 w-4" />
                  Tüm BibTeX&apos;i Kopyala
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>
    </>
  );
}

