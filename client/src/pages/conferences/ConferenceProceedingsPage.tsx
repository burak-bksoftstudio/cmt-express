import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ProceedingsHeader,
  ProceedingsList,
} from "@/components/proceedings";
import { proceedingsApi, ProceedingsData } from "@/lib/api";
import {
  ArrowLeft,
  BookOpen,
  AlertCircle,
  RefreshCw,
  FileText,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

function ProceedingsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Skeleton className="h-40 rounded-xl" />
      {/* Search & Filter Skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      {/* Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[200px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function ConferenceProceedingsPage() {
  const params = useParams();
  const conferenceId = params.id as string;

  const [data, setData] = useState<ProceedingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProceedings = useCallback(async () => {
    if (!conferenceId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await proceedingsApi.get(conferenceId);
      setData(response.data.data);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to load proceedings";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    fetchProceedings();
  }, [fetchProceedings]);

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Back Button */}
          <div className="flex items-center gap-4">
            <Link to={`/conferences/${conferenceId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Skeleton className="h-8 w-64" />
          </div>
          <ProceedingsPageSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Back Button */}
          <div className="flex items-center gap-4">
            <Link to={`/conferences/${conferenceId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Proceedings</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: appleEasing }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={fetchProceedings}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // No data state
  if (!data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Back Button */}
          <div className="flex items-center gap-4">
            <Link to={`/conferences/${conferenceId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Proceedings</h1>
          </div>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">No Proceedings Available</h3>
              <p className="mt-2 text-muted-foreground text-center max-w-sm">
                Proceedings will be available once papers are accepted and finalized.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Main content
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button & Title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: appleEasing }}
          className="flex items-center gap-4"
        >
          <Link to={`/conferences/${conferenceId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Proceedings</h1>
          </div>
        </motion.div>

        {/* Header */}
        <ProceedingsHeader
          conference={data.conference}
          totalPapers={data.statistics.totalAccepted}
          fullBibtex={data.fullBibtex}
          generatedAt={data.generatedAt}
        />

        {/* Empty State */}
        {data.acceptedPapers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: appleEasing, delay: 0.2 }}
          >
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-6 text-lg font-semibold">No Papers Yet</h3>
                <p className="mt-2 text-muted-foreground text-center max-w-sm">
                  No accepted papers available for proceedings.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Papers List */
          <ProceedingsList
            papers={data.acceptedPapers}
            statistics={data.statistics}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
