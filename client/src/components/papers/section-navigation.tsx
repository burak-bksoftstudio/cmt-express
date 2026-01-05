
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FileText,
  Users,
  FolderOpen,
  MessageSquare,
  UserCheck,
  Target,
  Camera,
  Scale,
  Star,
  MessagesSquare,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

export type PaperSection =
  | "overview"
  | "authors"
  | "files"
  | "reviews"
  | "metareview"
  | "discussion"
  | "assignments"
  | "bidding"
  | "camera-ready"
  | "decision";

interface SectionNavigationProps {
  activeSection: PaperSection;
  onSectionChange: (section: PaperSection) => void;
  showAssignments?: boolean;
  showBidding?: boolean;
  showDecision?: boolean;
  showMetareview?: boolean;
  showDiscussion?: boolean;
  reviewCount?: number;
  assignmentCount?: number;
}

const sections: {
  id: PaperSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "authors", label: "Authors", icon: Users },
  { id: "files", label: "Files", icon: FolderOpen },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "metareview", label: "Meta-review", icon: Star },
  { id: "discussion", label: "Discussion", icon: MessagesSquare },
  { id: "assignments", label: "Assignments", icon: UserCheck },
  { id: "bidding", label: "Bidding", icon: Target },
  { id: "camera-ready", label: "Camera Ready", icon: Camera },
  { id: "decision", label: "Decision", icon: Scale },
];

export function SectionNavigation({
  activeSection,
  onSectionChange,
  showAssignments = true,
  showBidding = true,
  showDecision = true,
  showMetareview = false,
  showDiscussion = false,
  reviewCount,
  assignmentCount,
}: SectionNavigationProps) {
  const visibleSections = sections.filter((section) => {
    if (section.id === "assignments" && !showAssignments) return false;
    if (section.id === "bidding" && !showBidding) return false;
    if (section.id === "decision" && !showDecision) return false;
    if (section.id === "metareview" && !showMetareview) return false;
    if (section.id === "discussion" && !showDiscussion) return false;
    return true;
  });

  const getBadgeCount = (sectionId: PaperSection) => {
    if (sectionId === "reviews" && reviewCount !== undefined) return reviewCount;
    if (sectionId === "assignments" && assignmentCount !== undefined) return assignmentCount;
    return undefined;
  };

  return (
    <nav className="space-y-1">
      {visibleSections.map((section, index) => {
        const isActive = activeSection === section.id;
        const badgeCount = getBadgeCount(section.id);

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              ease: appleEasing,
              delay: index * 0.05,
            }}
          >
            <button
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {/* Active background indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute inset-0 rounded-lg bg-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
              </AnimatePresence>

              <div className="relative z-10 flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2, ease: appleEasing }}
                >
                  <section.icon className="h-4 w-4" />
                </motion.div>
                <span>{section.label}</span>
              </div>

              {badgeCount !== undefined && badgeCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                    delay: index * 0.05 + 0.2,
                  }}
                  className={cn(
                    "relative z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {badgeCount}
                </motion.span>
              )}
            </button>
          </motion.div>
        );
      })}
    </nav>
  );
}
