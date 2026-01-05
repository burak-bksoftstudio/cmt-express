import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Users, Search, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Conference {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  isArchived: boolean;
  createdAt: string;
  _count?: {
    members: number;
    papers: number;
  };
}

export default function AllConferencesPage() {
  const navigate = useNavigate();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [filteredConferences, setFilteredConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadConferences();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = conferences.filter((conf) =>
        conf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conf.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConferences(filtered);
    } else {
      setFilteredConferences(conferences);
    }
  }, [searchQuery, conferences]);

  const loadConferences = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/conferences");
      setConferences(response.data.data || []);
      setFilteredConferences(response.data.data || []);
    } catch (error) {
      console.error("Error loading conferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeConferences = filteredConferences.filter((c) => !c.isArchived);
  const archivedConferences = filteredConferences.filter((c) => c.isArchived);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Conferences</h1>
            <p className="text-muted-foreground mt-1">
              Manage all conferences in the system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {conferences.length} Total
            </Badge>
            <Badge variant="default">
              {activeConferences.length} Active
            </Badge>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conferences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Conferences */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Conferences</h2>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading...
            </div>
          ) : activeConferences.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No active conferences found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeConferences.map((conference) => (
                <Card key={conference.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="line-clamp-2">{conference.name}</span>
                      <Badge variant="default" className="ml-2 shrink-0">
                        Active
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {conference.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {conference.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      {conference.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{conference.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(conference.startDate)} - {formatDate(conference.endDate)}
                        </span>
                      </div>
                      {conference._count && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {conference._count.members} members • {conference._count.papers} papers
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => navigate(`/conferences/${conference.id}`)}
                      className="w-full mt-2"
                      variant="outline"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Archived Conferences */}
        {archivedConferences.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Archived Conferences</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {archivedConferences.map((conference) => (
                <Card key={conference.id} className="opacity-60">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="line-clamp-2">{conference.name}</span>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        Archived
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(conference.startDate)} - {formatDate(conference.endDate)}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate(`/conferences/${conference.id}`)}
                      className="w-full mt-2"
                      variant="ghost"
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
