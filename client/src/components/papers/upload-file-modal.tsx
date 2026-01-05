
import { useState, useRef, useCallback, DragEvent } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { paperApi } from "@/lib/api";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  File,
  HardDrive,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

// File validation constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPES = ["application/pdf"];
const ALLOWED_EXTENSIONS = [".pdf"];

interface UploadFileModalProps {
  open: boolean;
  onClose: () => void;
  paperId: string;
  onUploadSuccess: () => void;
  currentVersion?: number;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function UploadFileModal({
  open,
  onClose,
  paperId,
  onUploadSuccess,
  currentVersion = 0,
}: UploadFileModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    if (uploadState !== "uploading") {
      setSelectedFile(null);
      setUploadState("idle");
      setUploadProgress(0);
      setError(null);
      setIsDragging(false);
      onClose();
    }
  }, [uploadState, onClose]);

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return "Only PDF files are allowed";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 50 MB";
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadState("idle");
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelect(file || null);
  };

  // Handle drag events
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file || null);
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState("uploading");
    setUploadProgress(0);
    setError(null);

    try {
      await paperApi.uploadFile(paperId, selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadState("success");
      setUploadProgress(100);

      // Auto-close after success
      setTimeout(() => {
        onUploadSuccess();
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || "Failed to upload file";
      setError(message);
      setUploadState("error");
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload New Version
          </DialogTitle>
          <DialogDescription>
            Upload a new version of your paper (v{currentVersion + 1})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Alert */}
          <AnimatePresence>
            {uploadState === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    File uploaded successfully as v{currentVersion + 1}!
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleInputChange}
            className="hidden"
            accept={ALLOWED_EXTENSIONS.join(",")}
            disabled={uploadState === "uploading"}
          />

          {/* Drop Zone / File Preview */}
          {!selectedFile ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: appleEasing }}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{
                    y: isDragging ? -5 : 0,
                    scale: isDragging ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className={`flex h-16 w-16 items-center justify-center rounded-full ${
                    isDragging ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <Upload
                    className={`h-8 w-8 ${
                      isDragging ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </motion.div>
                <div>
                  <p className="font-medium">
                    {isDragging ? "Drop your file here" : "Drag & drop your PDF"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    or click to browse
                  </p>
                </div>
                <Badge variant="secondary" className="mt-2">
                  PDF only, max 50 MB
                </Badge>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: appleEasing }}
              className="rounded-xl border bg-muted/30 p-4"
            >
              <div className="flex items-center gap-4">
                {/* File Icon */}
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                  <FileText className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(selectedFile.size)}
                    </span>
                    <span className="flex items-center gap-1">
                      <File className="h-3 w-3" />
                      PDF
                    </span>
                  </div>
                </div>

                {/* Remove Button */}
                {uploadState !== "uploading" && uploadState !== "success" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {uploadState === "uploading" && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-2"
                >
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Version Info */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>This will be version</span>
            <Badge variant="outline" className="bg-primary/10">
              v{currentVersion + 1}
            </Badge>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploadState === "uploading"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadState === "uploading" || uploadState === "success"}
          >
            {uploadState === "uploading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : uploadState === "success" ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Uploaded!
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

