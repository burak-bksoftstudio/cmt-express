import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConferenceStore } from "@/stores/conference-store";
import { useAuth } from "@/hooks/use-auth";
import { conferenceApi } from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronDown } from "lucide-react";
import { Conference, ConferenceRole } from "@/types";

interface ConferenceWithRole extends Conference {
    userRole?: ConferenceRole["role"];
}

export function ConferenceSelector() {
    const navigate = useNavigate();
    const { activeConferenceId, setActiveConference } = useConferenceStore();
    const { permissions } = useAuth();
    const [conferences, setConferences] = useState<ConferenceWithRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConferences = async () => {
            try {
                setLoading(true);
                // Fetch only conferences user is member of
                const response = await conferenceApi.getMyConferences();
                const confs = response.data.data || [];

                // Filter out archived by default
                const activeConfs = confs.filter(
                    (c: ConferenceWithRole) => c.status !== "archived"
                );

                setConferences(activeConfs);

                // If selected conference is not in user's conferences, clear selection
                if (
                    activeConferenceId &&
                    !activeConfs.find((c: ConferenceWithRole) => c.id === activeConferenceId)
                ) {
                    setActiveConference(null);
                }
            } catch (error) {
                console.error("Failed to fetch conferences:", error);
                setConferences([]);
            } finally {
                setLoading(false);
            }
        };

        fetchConferences();
    }, [activeConferenceId, setActiveConference]);

    const handleConferenceChange = (conferenceId: string) => {
        setActiveConference(conferenceId);
        // Navigate to conference detail page
        navigate(`/conferences/${conferenceId}`);
    };

    const getRoleBadgeVariant = (role?: string) => {
        switch (role) {
            case "chair":
                return "default";
            case "reviewer":
                return "secondary";
            case "author":
                return "outline";
            default:
                return "outline";
        }
    };

    if (loading) {
        return (
            <div className="px-3 py-2 border-b">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Active Conference
                </p>
                <Skeleton className="h-10 w-full rounded-md" />
            </div>
        );
    }

    if (conferences.length === 0) {
        return (
            <div className="px-3 py-2 border-b">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Active Conference
                </p>
                <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>No conferences</span>
                </div>
            </div>
        );
    }

    const selectedConference = conferences.find(
        (c) => c.id === activeConferenceId
    );

    return (
        <div className="px-3 py-2 border-b">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Active Conference
            </p>
            <Select value={activeConferenceId || ""} onValueChange={handleConferenceChange}>
                <SelectTrigger className="w-full">
                    <SelectValue>
                        {selectedConference ? (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 shrink-0" />
                                <span className="truncate text-sm">{selectedConference.name}</span>
                                {selectedConference.userRole && (
                                    <Badge
                                        variant={getRoleBadgeVariant(selectedConference.userRole)}
                                        className="ml-auto text-xs"
                                    >
                                        {selectedConference.userRole}
                                    </Badge>
                                )}
                            </div>
                        ) : (
                            <span className="text-muted-foreground">Select conference</span>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {conferences.map((conf) => (
                        <SelectItem key={conf.id} value={conf.id}>
                            <div className="flex items-center gap-2 py-1">
                                <div className="flex-1 min-w-0">
                                    <p className="truncate font-medium">{conf.name}</p>
                                    {conf.location && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {conf.location}
                                        </p>
                                    )}
                                </div>
                                {conf.userRole && (
                                    <Badge
                                        variant={getRoleBadgeVariant(conf.userRole)}
                                        className="text-xs shrink-0"
                                    >
                                        {conf.userRole}
                                    </Badge>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
