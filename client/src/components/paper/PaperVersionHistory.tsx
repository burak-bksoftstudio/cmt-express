import { useState, useEffect } from "react";
import { paperVersionApi } from "@/lib/api";
import { Clock, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface PaperVersion {
  id: string;
  paperId: string;
  version: number;
  versionType: "SUBMISSION" | "REVISION" | "CAMERA_READY";
  title: string;
  abstract?: string;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  createdAt: string;
  createdBy?: string;
  notes?: string;
}

interface PaperVersionHistoryProps {
  paperId: string;
}

const versionTypeConfig = {
  SUBMISSION: {
    label: "Initial Submission",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  REVISION: {
    label: "Revision",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  CAMERA_READY: {
    label: "Camera Ready",
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
};

export function PaperVersionHistory({ paperId }: PaperVersionHistoryProps) {
  const [versions, setVersions] = useState<PaperVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [paperId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paperVersionApi.getVersions(paperId);
      setVersions(response.data.data || []);
    } catch (err: any) {
      console.error("Error loading versions:", err);
      setError(err.response?.data?.message || "Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (version: PaperVersion) => {
    window.open(version.fileUrl, "_blank");
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-red-600 dark:text-red-400">
          {error}
        </div>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No versions available yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Version History</h3>
        <span className="text-sm text-muted-foreground">
          {versions.length} {versions.length === 1 ? "version" : "versions"}
        </span>
      </div>

      <div className="space-y-4">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={`border rounded-lg p-4 ${
              index === 0
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold">Version {version.version}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      versionTypeConfig[version.versionType].color
                    }`}
                  >
                    {versionTypeConfig[version.versionType].label}
                  </span>
                  {index === 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground">
                      Latest
                    </span>
                  )}
                </div>

                <div className="text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(version.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                <div className="text-sm mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  <span className="font-medium">{version.fileName}</span>
                </div>

                {version.notes && (
                  <div className="text-sm text-muted-foreground italic mt-2">
                    "{version.notes}"
                  </div>
                )}

                {version.title && version.title !== versions[0]?.title && (
                  <div className="text-sm mt-2 p-2 bg-muted rounded">
                    <span className="font-medium">Title: </span>
                    {version.title}
                  </div>
                )}
              </div>

              <Button
                size="sm"
                variant={index === 0 ? "default" : "outline"}
                onClick={() => handleDownload(version)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
