import { t } from "@/lib/i18n";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cameraReadyApi } from "@/lib/api";
import { useSimpleToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  File,
  X,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface CameraReadyUploadProps {
  paperId: string;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  onSuccess: () => void;
  disabled?: boolean;
}

export function CameraReadyUpload({
  paperId,
  maxSize = 50,
  allowedTypes = [".pdf"],
  onSuccess,
  disabled = false,
}: CameraReadyUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast, ToastRenderer } = useSimpleToast();

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Validate file
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      const extension = file.name.toLowerCase().split(".").pop();
      const allowedExtensions = allowedTypes.map((t) => t.replace(".", "").toLowerCase());
      if (!extension || !allowedExtensions.includes(extension)) {
        return `Only ${allowedTypes.join(", ")} files are allowed`;
      }

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        return `File size exceeds ${maxSize}MB limit`;
      }

      return null;
    },
    [allowedTypes, maxSize]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      setError(null);

      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        addToast({
          type: "error",
          title: "Invalid File",
          description: validationError,
        });
        return;
      }

      setFile(selectedFile);
    },
    [validateFile, addToast]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (disabled) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await cameraReadyApi.upload(paperId, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      addToast({
        type: "success",
        title: "Upload Successful",
        description: "Your camera-ready file has been submitted for review.",
      });

      setFile(null);
      onSuccess();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to upload file";
      setError(message);
      addToast({
        type: "error",
        title: "Upload Failed",
        description: message,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Camera Ready Version
        </CardTitle>
        <CardDescription>
          Upload the final camera-ready version of your paper (PDF only, max {maxSize}MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToastRenderer />

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          className="hidden"
          accept={allowedTypes.join(",")}
          disabled={disabled || uploading}
        />

        {/* Drop Zone */}
        <motion.div
          animate={{
            scale: dragging ? 1.02 : 1,
            borderColor: dragging ? "rgb(59, 130, 246)" : undefined,
          }}
          transition={{ duration: 0.2, ease: appleEasing }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
            dragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-muted-foreground/25 hover:border-primary hover:bg-muted/50",
            (disabled || uploading) && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <p className="mt-4 text-sm font-medium">
            {dragging ? "Drop your file here" : "Drag and drop your PDF here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            or click to browse
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <File className="h-3.5 w-3.5" />
            <span>PDF only, max {maxSize}MB</span>
          </div>
        </motion.div>

        {/* Selected File */}
        <AnimatePresence mode="wait">
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: appleEasing }}
              className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Progress */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading || disabled}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Camera Ready
              </>
            )}
          </Button>
          {file && !uploading && (
            <Button variant="outline" onClick={handleRemoveFile}>
              Cancel
            </Button>
          )}
        </div>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center">
          Your submission will be reviewed by the committee before final approval.
        </p>
      </CardContent>
    </Card>
  );
}

