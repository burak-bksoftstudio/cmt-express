import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { metareviewApi, MetareviewData } from "@/lib/api";
import { useConferenceStore } from "@/stores/conference-store";
import { useSimpleToast } from "@/components/ui/toast";
import {
  FileText,
  CheckCircle,
  Clock,
  Search,
  ArrowRight,
  Star,
  Calendar,
  User,
  MessageSquare,
} from "lucide-react";

export default function MetareviewsListPage() {
  const navigate = useNavigate();
  const { addToast, ToastRenderer } = useSimpleToast();
  const { activeConferenceId } = useConferenceStore();

  const [metareviews, setMetareviews] = useState<MetareviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchMetareviews = async () => {
      if (!activeConferenceId) {
        setLoading(false);
        return;
      }

      try {
        const response = await metareviewApi.getByConference(activeConferenceId);
        const data = response.data?.data || [];
        setMetareviews(data);
      } catch (error: any) {
        console.error("Failed to fetch metareviews:", error);
        if (error.response?.status !== 403) {
          addToast({
            type: "error",
            title: "Load Failed",
            description: "Failed to load metareviews",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetareviews();
  }, [activeConferenceId, addToast]);

  const filteredMetareviews = metareviews.filter((metareview) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      metareview.paper?.title?.toLowerCase().includes(searchLower) ||
      metareview.metaReviewer?.firstName?.toLowerCase().includes(searchLower) ||
      metareview.metaReviewer?.lastName?.toLowerCase().includes(searchLower) ||
      metareview.recommendation?.toLowerCase().includes(searchLower)
    );
  });

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "ACCEPT":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "REJECT":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "BORDERLINE":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    return recommendation.charAt(0) + recommendation.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!activeConferenceId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Star className="h-12 w-12 text-yellow-500" />
          <h2 className="mt-4 text-xl font-semibold">No Conference Selected</h2>
          <p className="text-muted-foreground">Please select a conference to view metareviews</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Star className="h-8 w-8 text-yellow-600" />
                Meta-reviews
              </h1>
              <p className="text-muted-foreground mt-1">
                View and manage all meta-reviews for this conference
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by paper title, meta-reviewer, or recommendation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{metareviews.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-2xl font-bold">
                    {metareviews.filter((m) => m.submittedAt).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Draft</p>
                  <p className="text-2xl font-bold">
                    {metareviews.filter((m) => !m.submittedAt).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Accept Rec.</p>
                  <p className="text-2xl font-bold">
                    {metareviews.filter((m) => m.recommendation === "ACCEPT").length}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Metareviews List */}
        {filteredMetareviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Meta-reviews Found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm
                    ? "No meta-reviews match your search criteria"
                    : "No meta-reviews have been created yet"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredMetareviews.map((metareview, index) => (
              <motion.div
                key={metareview.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent
                    className="p-6"
                    onClick={() => navigate(`/papers/${metareview.paperId}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{metareview.paper?.title}</h3>
                          <Badge className={getRecommendationColor(metareview.recommendation)}>
                            {getRecommendationLabel(metareview.recommendation)}
                          </Badge>
                          {metareview.submittedAt && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Submitted
                            </Badge>
                          )}
                          {!metareview.submittedAt && (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>
                              {metareview.metaReviewer
                                ? `${metareview.metaReviewer.firstName} ${metareview.metaReviewer.lastName}`
                                : "Unknown"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            <span>Confidence: {metareview.confidence}/5</span>
                          </div>

                          {metareview.submittedAt && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Submitted: {new Date(metareview.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {!metareview.submittedAt && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Updated: {new Date(metareview.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {metareview.summary && (
                          <div className="mt-3 flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {metareview.summary}
                            </p>
                          </div>
                        )}

                        {!metareview.reviewConsensus && (
                          <Badge variant="outline" className="mt-3 border-orange-300">
                            No Reviewer Consensus
                          </Badge>
                        )}
                      </div>

                      <Button variant="ghost" size="sm" className="ml-4">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <ToastRenderer />
    </DashboardLayout>
  );
}
