
import { useState, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Tag } from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface KeywordInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  maxKeywords?: number;
  maxLength?: number;
  disabled?: boolean;
  placeholder?: string;
}

export function KeywordInput({
  keywords,
  onChange,
  maxKeywords = 8,
  maxLength = 20,
  disabled = false,
  placeholder = "Type keyword and press Enter",
}: KeywordInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addKeyword = useCallback(() => {
    const trimmed = inputValue.trim().toLowerCase();
    
    // Validation
    if (!trimmed) {
      return;
    }
    
    if (trimmed.length > maxLength) {
      setError(`Keyword must be ${maxLength} characters or less`);
      return;
    }
    
    if (keywords.length >= maxKeywords) {
      setError(`Maximum ${maxKeywords} keywords allowed`);
      return;
    }
    
    if (keywords.includes(trimmed)) {
      setError("Keyword already exists");
      return;
    }
    
    // Add keyword
    onChange([...keywords, trimmed]);
    setInputValue("");
    setError(null);
  }, [inputValue, keywords, onChange, maxKeywords, maxLength]);

  const removeKeyword = useCallback((keyword: string) => {
    onChange(keywords.filter((k) => k !== keyword));
    setError(null);
  }, [keywords, onChange]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
      // Remove last keyword on backspace when input is empty
      removeKeyword(keywords[keywords.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow alphanumeric, spaces, and hyphens
    if (/^[a-zA-Z0-9\s-]*$/.test(value)) {
      setInputValue(value);
      setError(null);
    }
  };

  const canAddMore = keywords.length < maxKeywords;

  return (
    <div className="space-y-3">
      {/* Input Field */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Tag className="h-4 w-4" />
        </div>
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={canAddMore ? placeholder : "Maximum keywords reached"}
          disabled={disabled || !canAddMore}
          className="pl-10 pr-20"
          maxLength={maxLength}
        />
        <button
          type="button"
          onClick={addKeyword}
          disabled={disabled || !canAddMore || !inputValue.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease: appleEasing }}
            className="text-xs text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Keywords Display */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        <AnimatePresence mode="popLayout">
          {keywords.map((keyword) => (
            <motion.div
              key={keyword}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, ease: appleEasing }}
              layout
            >
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all hover:bg-secondary/80"
              >
                <span>{keyword}</span>
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  disabled={disabled}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors disabled:cursor-not-allowed"
                  aria-label={`Remove ${keyword}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>

        {keywords.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground italic"
          >
            No keywords added yet
          </motion.p>
        )}
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {keywords.length} / {maxKeywords} keywords
        </span>
        {inputValue && (
          <span>
            {inputValue.length} / {maxLength} characters
          </span>
        )}
      </div>
    </div>
  );
}

