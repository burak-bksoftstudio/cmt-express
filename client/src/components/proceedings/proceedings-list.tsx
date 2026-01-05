
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProceedingsItem } from "./proceedings-item";
import { AcceptedPaper } from "@/lib/api";
import { Search, Filter, FileText, LayoutGrid, List } from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface ProceedingsListProps {
  papers: AcceptedPaper[];
  statistics: {
    totalAccepted: number;
    byTrack: { track: string; count: number }[];
  };
  loading?: boolean;
}

function ProceedingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search & Filter Skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      {/* Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[200px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function ProceedingsList({ papers, statistics, loading }: ProceedingsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get unique tracks
  const tracks = useMemo(() => {
    const trackSet = new Set<string>();
    papers.forEach((p) => {
      if (p.track) trackSet.add(p.track);
    });
    return Array.from(trackSet).sort();
  }, [papers]);

  // Filter papers
  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.authors.some((a) =>
          a.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        paper.keywords.some((k) =>
          k.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Track filter
      const matchesTrack =
        trackFilter === "all" ||
        paper.track === trackFilter ||
        (!paper.track && trackFilter === "general");

      return matchesSearch && matchesTrack;
    });
  }, [papers, searchQuery, trackFilter]);

  if (loading) {
    return <ProceedingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing }}
        className="flex flex-col gap-4 sm:flex-row"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Makale, yazar veya anahtar kelime ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Track Filter */}
        <Select value={trackFilter} onValueChange={setTrackFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Track'e göre filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Trackler</SelectItem>
            {statistics.byTrack.map((t) => (
              <SelectItem key={t.track} value={t.track}>
                {t.track} ({t.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="hidden sm:flex items-center gap-1 border rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Statistics by Track */}
      {statistics.byTrack.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          {statistics.byTrack.map((t, index) => (
            <motion.div
              key={t.track}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Badge
                variant={trackFilter === t.track ? "default" : "outline"}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() =>
                  setTrackFilter(trackFilter === t.track ? "all" : t.track)
                }
              >
                {t.track}: {t.count}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between text-sm text-muted-foreground"
      >
        <span>
          {papers.length} makalenin {filteredPapers.length} tanesi gösteriliyor
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-primary hover:underline"
          >
            Aramayı temizle
          </button>
        )}
      </motion.div>

      {/* Papers Grid/List */}
      {filteredPapers.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-4"
          }
        >
          <AnimatePresence mode="popLayout">
            {filteredPapers.map((paper, index) => (
              <ProceedingsItem key={paper.id} paper={paper} index={index} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">Makale bulunamadı</h3>
              <p className="mt-2 text-muted-foreground text-center max-w-sm">
                {searchQuery || trackFilter !== "all"
                  ? "Arama veya filtre ayarlarınızı değiştirin."
                  : "Bu konferansta henüz kabul edilmiş makale yok."}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

