import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Paper, Conference, PaperAuthor, User, PaperFile } from "@/types";
import { FileText, Calendar, Users, Tag, Layers, Download, Loader2 } from "lucide-react";
import { paperApi } from "@/lib/api";

interface ReviewHeaderProps {
  paper: Paper & {
    conference?: Conference;
    authors?: (PaperAuthor & { user?: Partial<User> })[];
    track?: { name: string };
    files?: PaperFile[];
  };
  deadline?: string;
}

export function ReviewHeader({ paper, deadline }: ReviewHeaderProps) {
  const [downloading, setDownloading] = useState(false);
  
  const authorNames = paper.authors
    ?.map((a) => `${a.user?.firstName} ${a.user?.lastName}`)
    .join(", ");

  const handleDownload = async () => {
    if (!paper.files || paper.files.length === 0) return;
    
    setDownloading(true);
    try {
      const response = await paperApi.getDownloadUrl(paper.id);
      const { url, fileName } = response.data?.data || response.data;
      
      // Open download URL in new tab
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "paper.pdf";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  const latestFile = paper.files?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          {/* Paper Title */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold tracking-tight line-clamp-2">
                {paper.title}
              </h2>
              {paper.conference && (
                <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {paper.conference.name}
                </p>
              )}
            </div>
            {/* Download Button */}
            {latestFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
                className="shrink-0 gap-2"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download Paper
              </Button>
            )}
          </div>

          <Separator className="my-4" />

          {/* Metadata Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Authors */}
            {authorNames && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Authors</p>
                  <p className="text-sm">{authorNames}</p>
                </div>
              </div>
            )}

            {/* Track */}
            {paper.track && (
              <div className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Track</p>
                  <p className="text-sm">{paper.track.name}</p>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-start gap-2">
              <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <Badge variant="secondary" className="mt-0.5">
                  {paper.status}
                </Badge>
              </div>
            </div>

            {/* Deadline */}
            {deadline && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Review Deadline</p>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    {new Date(deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Abstract */}
          {paper.abstract && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Abstract</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {paper.abstract}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

