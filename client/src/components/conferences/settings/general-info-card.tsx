import { t } from "@/lib/i18n";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, MapPin, Calendar, FileText } from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface GeneralInfoCardProps {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  disabled?: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export function GeneralInfoCard({
  name,
  description,
  location,
  startDate,
  endDate,
  disabled = false,
  onNameChange,
  onDescriptionChange,
  onLocationChange,
  onStartDateChange,
  onEndDateChange,
}: GeneralInfoCardProps) {
  // Format date for datetime-local input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: appleEasing, delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Conference Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {t("fields.name.label")}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t("fields.name.placeholder")}
              disabled={disabled}
              className={disabled ? "bg-muted cursor-not-allowed" : ""}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("fields.description.label")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder={t("fields.description.placeholder")}
              rows={4}
              disabled={disabled}
              className={disabled ? "bg-muted cursor-not-allowed resize-none" : "resize-none"}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {t("fields.location.label")}
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder={t("fields.location.placeholder")}
              disabled={disabled}
              className={disabled ? "bg-muted cursor-not-allowed" : ""}
            />
          </div>

          {/* Date Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {t("fields.startDate.label")}
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formatDateForInput(startDate)}
                onChange={(e) => onStartDateChange(e.target.value)}
                disabled={disabled}
                className={disabled ? "bg-muted cursor-not-allowed" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {t("fields.endDate.label")}
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formatDateForInput(endDate)}
                onChange={(e) => onEndDateChange(e.target.value)}
                disabled={disabled}
                className={disabled ? "bg-muted cursor-not-allowed" : ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

