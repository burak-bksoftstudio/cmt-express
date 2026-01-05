
import { useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ReviewTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  minRows?: number;
  maxLength?: number;
  icon?: React.ReactNode;
}

export function ReviewTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  description,
  required = false,
  disabled = false,
  minRows = 4,
  maxLength,
  icon,
}: ReviewTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const lineHeight = 24; // approx line height in pixels
      const minHeight = lineHeight * minRows;
      textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
    }
  }, [value, minRows]);

  const charCount = value?.length || 0;
  const isOverLimit = maxLength && charCount > maxLength;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>
        {maxLength && (
          <span
            className={cn(
              "text-xs",
              isOverLimit ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {charCount} / {maxLength}
          </span>
        )}
      </div>
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "min-h-[100px] resize-none transition-all",
          isOverLimit && "border-red-500 focus-visible:ring-red-500"
        )}
        style={{ overflow: "hidden" }}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

