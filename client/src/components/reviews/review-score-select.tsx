
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Shield } from "lucide-react";

interface ReviewScoreSelectProps {
  type: "score" | "confidence";
  value: number | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const scoreLabels: Record<number, string> = {
  1: "Strong Reject",
  2: "Weak Reject",
  3: "Borderline",
  4: "Weak Accept",
  5: "Strong Accept",
};

const confidenceLabels: Record<number, string> = {
  1: "Very Low - Not familiar with the area",
  2: "Low - Some familiarity",
  3: "Medium - Reasonably confident",
  4: "High - Very confident",
  5: "Expert - Highly confident",
};

export function ReviewScoreSelect({
  type,
  value,
  onChange,
  disabled = false,
}: ReviewScoreSelectProps) {
  const isScore = type === "score";
  const labels = isScore ? scoreLabels : confidenceLabels;
  const Icon = isScore ? Star : Shield;
  const label = isScore ? "Overall Score" : "Confidence";
  const description = isScore
    ? "Your overall evaluation of this paper"
    : "How confident are you in your assessment?";

  const getScoreColor = (score: number) => {
    if (isScore) {
      if (score <= 2) return "text-red-600 dark:text-red-400";
      if (score === 3) return "text-yellow-600 dark:text-yellow-400";
      return "text-green-600 dark:text-green-400";
    }
    return "text-blue-600 dark:text-blue-400";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">{label} *</Label>
      </div>
      <Select
        value={value?.toString()}
        onValueChange={(v) => onChange(parseInt(v))}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5].map((score) => (
            <SelectItem key={score} value={score.toString()}>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${getScoreColor(score)}`}>
                  {score}
                </span>
                <span className="text-muted-foreground">-</span>
                <span>{labels[score]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

