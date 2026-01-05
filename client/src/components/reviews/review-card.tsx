
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  Layers,
  Clock,
  Edit,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface AssignedReview {
  id: string;
  assignmentId: string;
  status: "not_started" | "draft" | "submitted";
  paper: {
    id: string;
    title: string;
    abstract?: string;
    conference?: {
      id: string;
      name: string;
    };
    track?: {
      name: string;
    };
  };
  deadline?: string;
  createdAt: string;
}

interface ReviewCardProps {
  review: AssignedReview;
  index: number;
}

const statusConfig = {
  not_started: {
    label: "Not Started",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: AlertCircle,
  },
  draft: {
    label: "Draft",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Edit,
  },
  submitted: {
    label: "Submitted",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
  },
};

export function ReviewCard({ review, index }: ReviewCardProps) {
  const status = statusConfig[review.status] || statusConfig.not_started;
  const StatusIcon = status.icon;
  
  const isOverdue =
    review.deadline && new Date(review.deadline) < new Date() && review.status !== "submitted";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="h-full overflow-hidden border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0 group-hover:bg-primary/20 transition-colors">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <Badge className={status.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>

          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {review.paper.title}
          </h3>

          <div className="space-y-2 text-sm text-muted-foreground">
            {review.paper.conference && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span className="truncate">{review.paper.conference.name}</span>
              </div>
            )}
            {review.paper.track && (
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" />
                <span>{review.paper.track.name}</span>
              </div>
            )}
            {review.deadline && (
              <div className={`flex items-center gap-2 ${isOverdue ? "text-red-500" : ""}`}>
                <Clock className={`h-3.5 w-3.5 ${isOverdue ? "animate-pulse" : ""}`} />
                <span>
                  {isOverdue ? "Overdue: " : "Due: "}
                  {new Date(review.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {review.paper.abstract && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
              {review.paper.abstract}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-0 pb-4">
          <Link to={`/reviews/${review.id}`} className="w-full">
            <Button
              className="w-full gap-2"
              variant={review.status === "submitted" ? "outline" : "default"}
            >
              <Edit className="h-4 w-4" />
              {review.status === "submitted"
                ? "View Review"
                : review.status === "draft"
                ? "Continue Review"
                : "Write Review"}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

