

import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useAuth } from "@/hooks/use-auth";
import { Building2, ChevronDown } from "lucide-react";

export function ConferenceSelector() {
  const { permissions } = useAuth();
  const {
    conferences,
    selectedConferenceId,
    conferencesLoading,
    setSelectedConference,
    fetchConferences,
  } = useDashboardStore();

  // Fetch conferences on mount
  useEffect(() => {
    fetchConferences(permissions.isAdmin);
  }, [permissions.isAdmin, fetchConferences]);

  // Loading state
  if (conferencesLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-[200px]" />
      </div>
    );
  }

  // No conferences available
  if (conferences.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Konferans bulunamadı</span>
      </div>
    );
  }

  // Get selected conference name
  const selectedConference = conferences.find((c) => c.id === selectedConferenceId);

  return (
    <div className="flex items-center gap-3">
      <Select
        value={selectedConferenceId || ""}
        onValueChange={(value) => setSelectedConference(value || null)}
      >
        <SelectTrigger className="w-[280px] bg-background">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Konferans seç">
              {selectedConference ? (
                <span className="truncate">{selectedConference.name}</span>
              ) : (
                <span className="text-muted-foreground">Konferans seç</span>
              )}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {conferences.map((conference) => (
            <SelectItem
              key={conference.id}
              value={conference.id}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4 w-full">
                <span className="truncate">{conference.name}</span>
                {conference.status && (
                  <Badge
                    variant="outline"
                    className={
                      conference.status === "active"
                        ? "border-green-500 text-green-600"
                        : "border-yellow-500 text-yellow-600"
                    }
                  >
                    {conference.status}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Show conference count for admins */}
      {permissions.isAdmin && (
        <Badge variant="secondary" className="shrink-0">
          {conferences.length} konferans
        </Badge>
      )}
    </div>
  );
}

