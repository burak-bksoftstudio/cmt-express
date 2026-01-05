import { useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { PaperSubmitForm } from "@/components/papers/paper-submit-form";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

export default function SubmitPaperPage() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  const [searchParams] = useSearchParams();
  const conferenceId = searchParams.get("conferenceId");

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/sign-in");
    }
  }, [isSignedIn, isLoaded, navigate]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/papers">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Submit Paper
              </h1>
              <p className="text-muted-foreground">
                Submit your paper to a conference
              </p>
            </div>
          </div>
        </div>

        {/* Submission Form */}
        <PaperSubmitForm defaultConferenceId={conferenceId || undefined} />

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            By submitting your paper, you agree to the conference&apos;s submission guidelines
            and terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
