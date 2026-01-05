import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, FileText, Calendar, Users, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Paper {
  id: string;
  title: string;
  abstract?: string;
  status: string;
  createdAt: string;
  conference: {
    id: string;
    name: string;
  };
  authors: Array<{
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  _count?: {
    reviewAssignments: number;
    cameraReadyFiles: number;
  };
  decision?: {
    finalDecision: string;
  };
}

export default function AllPapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [conferenceFilter, setConferenceFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadPapers();
  }, []);

  useEffect(() => {
    filterPapers();
  }, [searchTerm, statusFilter, conferenceFilter, papers]);

  const loadPapers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/papers");
      const data = response.data?.data || response.data || [];
      setPapers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load papers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load papers",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPapers = () => {
    let filtered = [...papers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.authors.some((a) =>
            `${a.user.firstName} ${a.user.lastName}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          )
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "accepted") {
        filtered = filtered.filter((p) => p.decision?.finalDecision === "accept");
      } else if (statusFilter === "rejected") {
        filtered = filtered.filter((p) => p.decision?.finalDecision === "reject");
      } else if (statusFilter === "under-review") {
        filtered = filtered.filter((p) => !p.decision && (p._count?.reviewAssignments || 0) > 0);
      } else if (statusFilter === "submitted") {
        filtered = filtered.filter((p) => !p.decision && (p._count?.reviewAssignments || 0) === 0);
      }
    }

    // Conference filter
    if (conferenceFilter !== "all") {
      filtered = filtered.filter((p) => p.conference.id === conferenceFilter);
    }

    setFilteredPapers(filtered);
  };

  const getStatusBadge = (paper: Paper) => {
    if (paper.decision?.finalDecision === "accept") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700">
          Accepted
        </Badge>
      );
    }
    if (paper.decision?.finalDecision === "reject") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700">
          Rejected
        </Badge>
      );
    }
    if ((paper._count?.reviewAssignments || 0) > 0) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Under Review ({paper._count?.reviewAssignments})
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
        Submitted
      </Badge>
    );
  };

  const uniqueConferences = Array.from(
    new Set(papers.map((p) => JSON.stringify({ id: p.conference.id, name: p.conference.name })))
  ).map((c) => JSON.parse(c));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Papers</h1>
        <p className="text-muted-foreground">
          View and manage all submitted papers across all conferences
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conference</label>
              <Select value={conferenceFilter} onValueChange={setConferenceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All conferences" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All conferences</SelectItem>
                  {uniqueConferences.map((conf: any) => (
                    <SelectItem key={conf.id} value={conf.id}>
                      {conf.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchTerm || statusFilter !== "all" || conferenceFilter !== "all") && (
            <div className="mt-4 flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Showing {filteredPapers.length} of {papers.length} papers
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setConferenceFilter("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Papers List */}
      {filteredPapers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {papers.length === 0 ? "No papers found" : "No papers match your filters"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPapers.map((paper) => (
            <Link key={paper.id} to={`/papers/${paper.id}`}>
              <Card className="transition-all hover:shadow-md cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1 text-base">
                        {paper.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {paper.abstract || "No abstract provided"}
                      </CardDescription>
                    </div>
                    <div className="ml-4">{getStatusBadge(paper)}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Conference:</span>
                      <span>{paper.conference.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Authors:</span>
                      <span>
                        {paper.authors
                          .map((a) => `${a.user.firstName} ${a.user.lastName}`)
                          .join(", ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Submitted:</span>
                      <span>{new Date(paper.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
