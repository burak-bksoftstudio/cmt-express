import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { conferenceApi, paperApi } from "@/lib/api";
import { Conference, Track } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  MapPin,
  FileText,
  Users,
  Upload,
  Loader2,
  AlertCircle,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Tag,
  Layers,
} from "lucide-react";

// Animation variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// Step definitions
const STEPS = [
  { id: 1, title: "Conference", icon: Calendar, description: "Select conference" },
  { id: 2, title: "Track", icon: Layers, description: "Choose track" },
  { id: 3, title: "Metadata", icon: FileText, description: "Paper details" },
  { id: 4, title: "Authors", icon: Users, description: "Add co-authors" },
  { id: 5, title: "Upload", icon: Upload, description: "Submit file" },
];

// Author interface
interface Author {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  order: number;
  isPrimary: boolean;
}

export default function NewPaperPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);

  // Data state
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(false);

  // Form state
  const [selectedConference, setSelectedConference] = useState<Conference | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [authors, setAuthors] = useState<Author[]>([]);
  const [file, setFile] = useState<File | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch conferences on mount
  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await conferenceApi.getAll();
        setConferences(response.data.data || []);
      } catch (err) {
        setError("Failed to load conferences");
      } finally {
        setLoading(false);
      }
    };
    fetchConferences();
  }, []);

  // Initialize primary author from current user
  useEffect(() => {
    if (user && authors.length === 0) {
      setAuthors([
        {
          id: "primary",
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          order: 1,
          isPrimary: true,
        },
      ]);
    }
  }, [user, authors.length]);

  // Fetch tracks when conference is selected
  useEffect(() => {
    const fetchTracks = async () => {
      if (!selectedConference) {
        setTracks([]);
        return;
      }

      setTracksLoading(true);
      try {
        const response = await conferenceApi.getTracks(selectedConference.id);
        setTracks(response.data.data || []);
      } catch (err) {
        console.error("Failed to load tracks:", err);
        setTracks([]);
      } finally {
        setTracksLoading(false);
      }
    };
    fetchTracks();
  }, [selectedConference]);

  // Navigation
  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
    setError(null);
  };

  const nextStep = () => {
    if (currentStep < 5) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  // Validation
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return selectedConference !== null;
      case 2:
        return true; // Track is optional
      case 3:
        return title.trim().length > 0 && abstract.trim().length > 0;
      case 4:
        return authors.length > 0;
      case 5:
        return file !== null;
      default:
        return false;
    }
  }, [currentStep, selectedConference, title, abstract, authors, file]);

  // Keyword handling
  const addKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase();
    if (keyword && !keywords.includes(keyword) && keywords.length < 10) {
      setKeywords([...keywords, keyword]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  // Author handling
  const addAuthor = () => {
    const newAuthor: Author = {
      id: `author-${Date.now()}`,
      firstName: "",
      lastName: "",
      email: "",
      order: authors.length + 1,
      isPrimary: false,
    };
    setAuthors([...authors, newAuthor]);
  };

  const updateAuthor = (id: string, field: keyof Author, value: string | number) => {
    setAuthors(
      authors.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const removeAuthor = (id: string) => {
    const author = authors.find((a) => a.id === id);
    if (author?.isPrimary) return; // Can't remove primary author

    setAuthors(
      authors
        .filter((a) => a.id !== id)
        .map((a, index) => ({ ...a, order: index + 1 }))
    );
  };

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.includes("pdf")) {
        setError("Only PDF files are allowed");
        return;
      }
      // Validate file size (50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.type.includes("pdf")) {
        setError("Only PDF files are allowed");
        return;
      }
      if (droppedFile.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  // Submit paper
  const handleSubmit = async () => {
    if (!selectedConference || !title || !abstract || !file) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Step 1: Create paper
      const paperResponse = await paperApi.create({
        conferenceId: selectedConference.id,
        trackId: selectedTrack?.id,
        title,
        abstract,
        keywords,
      });

      const paperId = paperResponse.data.data.id;

      // Step 2: Add co-authors (skip primary author)
      const coAuthors = authors.filter((a) => !a.isPrimary && a.email);
      if (coAuthors.length > 0) {
        await paperApi.addAuthors(
          paperId,
          coAuthors.map((a) => ({
            firstName: a.firstName,
            lastName: a.lastName,
            email: a.email,
            order: a.order,
          }))
        );
      }

      // Step 3: Upload file
      await paperApi.uploadFile(paperId, file, (progress) => {
        setUploadProgress(progress);
      });

      setSuccess(true);

      // Redirect after short delay
      setTimeout(() => {
        navigate(`/papers/${paperId}`);
      }, 2000);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to submit paper";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  // Success state
  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50"
                >
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </motion.div>
                <h2 className="mt-6 text-2xl font-bold text-green-800 dark:text-green-200">
                  Paper Submitted Successfully!
                </h2>
                <p className="mt-2 text-green-700 dark:text-green-300">
                  Redirecting to your paper...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/papers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Submit New Paper</h1>
            <p className="text-muted-foreground">
              Follow the steps to submit your paper
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => isCompleted && goToStep(step.id)}
                  disabled={!isCompleted && currentStep !== step.id}
                  className={`flex flex-col items-center gap-2 transition-all ${
                    isCompleted ? "cursor-pointer" : ""
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCompleted
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-muted-foreground/30 bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive
                        ? "text-primary"
                        : isCompleted
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-16 mx-2 ${
                      currentStep > step.id ? "bg-green-500" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        <Card className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Step 1: Select Conference */}
              {currentStep === 1 && (
                <CardContent className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Select Conference</CardTitle>
                    <CardDescription>
                      Choose the conference you want to submit your paper to
                    </CardDescription>
                  </CardHeader>
                  <div className="grid gap-4 mt-4">
                    {conferences.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No conferences available for submission
                      </div>
                    ) : (
                      conferences.map((conference) => (
                        <div
                          key={conference.id}
                          onClick={() => setSelectedConference(conference)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedConference?.id === conference.id
                              ? "border-primary bg-primary/5"
                              : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{conference.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {conference.description || "No description"}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(conference.startDate)} -{" "}
                                  {formatDate(conference.endDate)}
                                </span>
                                {conference.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {conference.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedConference?.id === conference.id && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              )}

              {/* Step 2: Select Track */}
              {currentStep === 2 && (
                <CardContent className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Select Track (Optional)</CardTitle>
                    <CardDescription>
                      Choose the track that best fits your paper topic
                    </CardDescription>
                  </CardHeader>
                  <div className="grid gap-4 mt-4">
                    {tracksLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-24 w-full" />
                        ))}
                      </div>
                    ) : tracks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No tracks found for this conference</p>
                        <p className="text-sm mt-1">You can proceed without selecting a track</p>
                      </div>
                    ) : (
                      <>
                        {/* No track option */}
                        <div
                          onClick={() => setSelectedTrack(null)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedTrack === null
                              ? "border-primary bg-primary/5"
                              : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">General Submission</h3>
                              <p className="text-sm text-muted-foreground">
                                Submit without a specific track
                              </p>
                            </div>
                            {selectedTrack === null && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Track options */}
                        {tracks.map((track) => (
                          <div
                            key={track.id}
                            onClick={() => setSelectedTrack(track)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedTrack?.id === track.id
                                ? "border-primary bg-primary/5"
                                : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold">{track.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {track.description || "No description"}
                                </p>
                                <Badge variant="secondary" className="mt-2">
                                  {track._count?.papers || 0} papers
                                </Badge>
                              </div>
                              {selectedTrack?.id === track.id && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                                  <Check className="h-4 w-4 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              )}

              {/* Step 3: Metadata */}
              {currentStep === 3 && (
                <CardContent className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Paper Details</CardTitle>
                    <CardDescription>
                      Enter your paper title, abstract, and keywords
                    </CardDescription>
                  </CardHeader>
                  <div className="space-y-6 mt-4">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter your paper title"
                        className="text-lg"
                      />
                    </div>

                    {/* Abstract */}
                    <div className="space-y-2">
                      <Label htmlFor="abstract">Abstract *</Label>
                      <Textarea
                        id="abstract"
                        value={abstract}
                        onChange={(e) => setAbstract(e.target.value)}
                        placeholder="Enter your paper abstract"
                        rows={8}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        {abstract.length} characters
                      </p>
                    </div>

                    {/* Keywords */}
                    <div className="space-y-2">
                      <Label>Keywords (up to 10)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          placeholder="Add a keyword"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addKeyword();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addKeyword}
                          disabled={keywords.length >= 10}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {keywords.map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="secondary"
                            className="gap-1"
                          >
                            <Tag className="h-3 w-3" />
                            {keyword}
                            <button
                              onClick={() => removeKeyword(keyword)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}

              {/* Step 4: Authors */}
              {currentStep === 4 && (
                <CardContent className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Authors</CardTitle>
                    <CardDescription>
                      Add co-authors to your paper. You are automatically added as the primary author.
                    </CardDescription>
                  </CardHeader>
                  <div className="space-y-4 mt-4">
                    {authors.map((author, index) => (
                      <div
                        key={author.id}
                        className={`p-4 rounded-xl border ${
                          author.isPrimary
                            ? "border-primary/30 bg-primary/5"
                            : "border-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={author.isPrimary ? "default" : "secondary"}>
                              Author {index + 1}
                            </Badge>
                            {author.isPrimary && (
                              <Badge variant="outline">Primary</Badge>
                            )}
                          </div>
                          {!author.isPrimary && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAuthor(author.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Input
                            placeholder="First Name"
                            value={author.firstName}
                            onChange={(e) =>
                              updateAuthor(author.id, "firstName", e.target.value)
                            }
                            disabled={author.isPrimary}
                          />
                          <Input
                            placeholder="Last Name"
                            value={author.lastName}
                            onChange={(e) =>
                              updateAuthor(author.id, "lastName", e.target.value)
                            }
                            disabled={author.isPrimary}
                          />
                          <Input
                            placeholder="Email"
                            type="email"
                            value={author.email}
                            onChange={(e) =>
                              updateAuthor(author.id, "email", e.target.value)
                            }
                            disabled={author.isPrimary}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAuthor}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Co-Author
                    </Button>
                  </div>
                </CardContent>
              )}

              {/* Step 5: File Upload */}
              {currentStep === 5 && (
                <CardContent className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle>Upload Paper</CardTitle>
                    <CardDescription>
                      Upload your paper in PDF format (max 50MB)
                    </CardDescription>
                  </CardHeader>
                  <div className="mt-4">
                    {/* Drop Zone */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                        file
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                          : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />

                      {file ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                          <p className="font-medium text-green-800 dark:text-green-200">
                            {file.name}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="font-medium">
                            Drag and drop your PDF here
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            or click to browse
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Upload Progress */}
                    {submitting && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="mt-6 p-4 rounded-xl bg-muted/50">
                      <h4 className="font-medium mb-3">Submission Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Conference</span>
                          <span className="font-medium">{selectedConference?.name}</span>
                        </div>
                        {selectedTrack && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Track</span>
                            <span className="font-medium">{selectedTrack.name}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Title</span>
                          <span className="font-medium truncate max-w-[200px]">{title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Authors</span>
                          <span className="font-medium">{authors.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Keywords</span>
                          <span className="font-medium">{keywords.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between p-6 border-t bg-muted/30">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || submitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < 5 ? (
              <Button onClick={nextStep} disabled={!canProceed()}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Submit Paper
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
