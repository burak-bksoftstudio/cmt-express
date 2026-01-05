import { t } from "@/lib/i18n";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaperFile } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { paperApi } from "@/lib/api";
import {
  FileText,
  Download,
  Upload,
  Loader2,
  File,
  FileImage,
  FileCode,
} from "lucide-react";

interface PaperFileTableProps {
  files: PaperFile[];
  paperId: string;
  canUpload?: boolean;
  onFileUploaded?: () => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
  if (mimeType.includes("image")) return <FileImage className="h-5 w-5 text-blue-500" />;
  if (mimeType.includes("text") || mimeType.includes("code")) return <FileCode className="h-5 w-5 text-green-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "Unknown size";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export function PaperFileTable({
  files,
  paperId,
  canUpload = false,
  onFileUploaded,
}: PaperFileTableProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      await paperApi.uploadFile(paperId, file);
      onFileUploaded?.();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to upload file";
      setUploadError(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {canUpload && (
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.tex,.zip"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </>
            )}
          </Button>
          {uploadError && (
            <span className="text-sm text-destructive">{uploadError}</span>
          )}
        </div>
      )}

      {/* Files Table */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            No files uploaded yet
          </p>
          {canUpload && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload your first file
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  File
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Uploaded
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.mimeType)}
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {file.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {file.mimeType.split("/").pop()?.toUpperCase() || "FILE"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDateTime(file.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

