import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2, FolderTree } from "lucide-react";
import { conferenceApi, api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Track {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    papers: number;
  };
}

interface TrackManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conferenceId: string;
  conferenceName: string;
}

export function TrackManagementDialog({
  open,
  onOpenChange,
  conferenceId,
  conferenceName,
}: TrackManagementDialogProps) {
  const { toast } = useToast();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // New track form
  const [showForm, setShowForm] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [trackDescription, setTrackDescription] = useState("");

  useEffect(() => {
    if (open && conferenceId) {
      fetchTracks();
    }
  }, [open, conferenceId]);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/conferences/${conferenceId}/tracks`);
      const fetchedTracks = response.data?.data || [];
      setTracks(fetchedTracks);
    } catch (error) {
      console.error("Failed to fetch tracks:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tracks",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrack = async () => {
    if (!trackName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Track name is required",
      });
      return;
    }

    setCreating(true);
    try {
      await api.post(`/conferences/${conferenceId}/tracks`, {
        name: trackName.trim(),
        description: trackDescription.trim() || undefined,
      });

      toast({
        title: "Track Created",
        description: `Track "${trackName}" has been created successfully`,
      });

      // Reset form
      setTrackName("");
      setTrackDescription("");
      setShowForm(false);

      // Refresh tracks list
      fetchTracks();
    } catch (error: any) {
      console.error("Failed to create track:", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.response?.data?.message || "Failed to create track",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (trackId: string, trackName: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (track?._count?.papers && track._count.papers > 0) {
      toast({
        variant: "destructive",
        title: "Cannot Delete",
        description: `Track "${trackName}" has ${track._count.papers} paper(s) assigned. Please reassign papers before deleting.`,
      });
      return;
    }

    setDeleting(trackId);
    try {
      await api.delete(`/conferences/${conferenceId}/tracks/${trackId}`);

      toast({
        title: "Track Deleted",
        description: `Track "${trackName}" has been deleted`,
      });

      fetchTracks();
    } catch (error: any) {
      console.error("Failed to delete track:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.response?.data?.message || "Failed to delete track",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Manage Tracks
          </DialogTitle>
          <DialogDescription>
            Organize submissions into tracks for {conferenceName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Existing Tracks */}
              {tracks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Existing Tracks ({tracks.length})</h4>
                  </div>
                  {tracks.map((track) => (
                    <Card key={track.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium">{track.name}</h5>
                              {track._count && (
                                <Badge variant="secondary" className="text-xs">
                                  {track._count.papers} paper{track._count.papers !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                            {track.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {track.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(track.id, track.name)}
                            disabled={deleting === track.id}
                          >
                            {deleting === track.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {tracks.length > 0 && <Separator />}

              {/* Create New Track */}
              {!showForm ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Track
                </Button>
              ) : (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="track-name">Track Name *</Label>
                      <Input
                        id="track-name"
                        placeholder="e.g., Artificial Intelligence, Database Systems"
                        value={trackName}
                        onChange={(e) => setTrackName(e.target.value)}
                        disabled={creating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="track-description">Description (Optional)</Label>
                      <Textarea
                        id="track-description"
                        placeholder="Brief description of this track's focus area"
                        value={trackDescription}
                        onChange={(e) => setTrackDescription(e.target.value)}
                        disabled={creating}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateTrack}
                        disabled={creating || !trackName.trim()}
                        className="flex-1"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Track
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowForm(false);
                          setTrackName("");
                          setTrackDescription("");
                        }}
                        disabled={creating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {tracks.length === 0 && !showForm && (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No tracks created yet</p>
                  <p className="text-xs mt-1">Click "Add New Track" to get started</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
