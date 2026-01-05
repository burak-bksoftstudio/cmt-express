import { t } from "@/lib/i18n";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSimpleToast } from "@/components/ui/toast";
import { proceedingsApi } from "@/lib/api";
import { Download, Loader2, FileText } from "lucide-react";

interface PdfDownloadButtonProps {
  conferenceId: string;
  conferenceName: string;
  year: number;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

export function PdfDownloadButton({
  conferenceId,
  conferenceName,
  year,
  variant = "default",
  size = "default",
}: PdfDownloadButtonProps) {
  const { addToast, ToastRenderer } = useSimpleToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await proceedingsApi.getPdf(conferenceId);
      const blob = new Blob([response.data], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Clean filename
      const cleanName = conferenceName
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();
      a.download = `${cleanName}-${year}-proceedings.html`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast({
        type: "success",
        title: "İndirme Başladı",
        description: "Bildiri kitapçığı indiriliyor. Dosyayı açıp Yazdır > PDF olarak kaydet seçin.",
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

  return (
    <>
      <ToastRenderer />
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant={variant}
          size={size}
          onClick={handleDownload}
          disabled={downloading}
          className="gap-2"
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Hazırlanıyor...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Bildiri Kitapçığını İndir
            </>
          )}
        </Button>
      </motion.div>
    </>
  );
}

