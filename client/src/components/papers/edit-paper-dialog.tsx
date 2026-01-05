import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { paperApi } from "@/lib/api";
import { Loader2, X } from "lucide-react";

interface EditPaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paperId: string;
  initialData: {
    title: string;
    abstract?: string;
    keywords?: { keyword?: { name: string } }[];
    trackId?: string;
  };
  onSuccess?: () => void;
}

export function EditPaperDialog({
  open,
  onOpenChange,
  paperId,
  initialData,
  onSuccess,
}: EditPaperDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initialData.title);
  const [abstract, setAbstract] = useState(initialData.abstract || "");
  const [keywords, setKeywords] = useState<string[]>(
    initialData.keywords?.map((k) => k.keyword?.name || "").filter(Boolean) || []
  );
  const [keywordInput, setKeywordInput] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle(initialData.title);
      setAbstract(initialData.abstract || "");
      setKeywords(
        initialData.keywords?.map((k) => k.keyword?.name || "").filter(Boolean) || []
      );
      setKeywordInput("");
    }
  }, [open, initialData]);

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed) && keywords.length < 10) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await paperApi.update(paperId, {
        title: title.trim(),
        abstract: abstract.trim() || undefined,
        keywords,
        trackId: initialData.trackId,
      });

      toast({
        title: "Success",
        description: "Paper updated successfully",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update paper";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Paper</DialogTitle>
          <DialogDescription>
            Update your paper's title, abstract, and keywords. Changes are only allowed before the review process starts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter paper title"
              required
              disabled={loading}
            />
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <Label htmlFor="abstract">Abstract</Label>
            <Textarea
              id="abstract"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Enter paper abstract"
              rows={6}
              disabled={loading}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {abstract.length} characters
            </p>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">
              Keywords
              <span className="text-xs text-muted-foreground ml-2">
                (Max 10)
              </span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Add keyword and press Enter"
                disabled={loading || keywords.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddKeyword}
                disabled={!keywordInput.trim() || keywords.length >= 10 || loading}
              >
                Add
              </Button>
            </div>

            {/* Keywords Display */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="gap-1">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1 hover:text-destructive"
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
