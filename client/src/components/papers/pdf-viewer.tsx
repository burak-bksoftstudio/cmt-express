import { t } from "@/lib/i18n";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Download,
  AlertCircle,
  FileText,
  Maximize2,
  Minimize2,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface PDFViewerProps {
  fileUrl: string;
  fileName?: string;
}

// Zoom levels
const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
const DEFAULT_ZOOM_INDEX = 2; // 100%

export function PDFViewer({ fileUrl, fileName }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const zoom = ZOOM_LEVELS[zoomIndex];

  // Load PDF document
  useEffect(() => {
    let cancelled = false;

    const loadPDF = async () => {
      setLoading(true);
      setError(null);

      try {
        // Dynamic import to avoid SSR issues
        const { pdfjsLib } = await import("@/lib/pdf-worker");

        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          withCredentials: true,
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;

        if (!cancelled) {
          setPdfDocument(pdf);
          setNumPages(pdf.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error("Failed to load PDF:", err);
          setError("Failed to load PDF. The file may be corrupted or inaccessible.");
          setLoading(false);
        }
      }
    };

    if (fileUrl) {
      loadPDF();
    }

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current) return;

    try {
      const page = await pdfDocument.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      // Calculate viewport with zoom
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = zoom * (window.devicePixelRatio || 1);
      const viewport = page.getViewport({ scale });

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${baseViewport.width * zoom}px`;
      canvas.style.height = `${baseViewport.height * zoom}px`;

      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error("Failed to render page:", err);
    }
  }, [pdfDocument, currentPage, zoom]);

  // Re-render on page or zoom change
  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Navigation handlers
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  // Zoom handlers
  const zoomIn = () => {
    if (zoomIndex < ZOOM_LEVELS.length - 1) {
      setZoomIndex((z) => z + 1);
    }
  };

  const zoomOut = () => {
    if (zoomIndex > 0) {
      setZoomIndex((z) => z - 1);
    }
  };

  const resetZoom = () => {
    setZoomIndex(DEFAULT_ZOOM_INDEX);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full flex-col">
        {/* Toolbar skeleton */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        {/* Content skeleton */}
        <div className="flex flex-1 items-center justify-center bg-muted/30 p-8">
          <div className="space-y-4 text-center">
            <Skeleton className="mx-auto h-[400px] w-[300px]" />
            <Skeleton className="mx-auto h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md"
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading PDF</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-6 flex flex-col items-center gap-4">
            <FileText className="h-16 w-16 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground text-center">
              Unable to preview this file. You can try downloading it instead.
            </p>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download File
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full flex-col bg-muted/30">
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: appleEasing }}
        className="flex flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2 sm:px-4"
      >
        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[80px] text-center text-sm">
            <span className="font-medium">{currentPage}</span>
            <span className="text-muted-foreground"> / {numPages}</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            disabled={zoomIndex <= 0}
            className="h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <button
            onClick={resetZoom}
            className="min-w-[60px] rounded-md px-2 py-1 text-sm font-medium hover:bg-muted transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
            className="h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </motion.div>

      {/* PDF Canvas Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: appleEasing, delay: 0.1 }}
        className="flex-1 overflow-auto"
      >
        <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
          <div className="relative shadow-xl rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
            <canvas
              ref={canvasRef}
              className="block"
              style={{ maxWidth: "100%" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Page indicator (mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: appleEasing, delay: 0.2 }}
        className="border-t bg-background px-4 py-2 text-center text-xs text-muted-foreground sm:hidden"
      >
        Page {currentPage} of {numPages} • {Math.round(zoom * 100)}% zoom
      </motion.div>
    </div>
  );
}

