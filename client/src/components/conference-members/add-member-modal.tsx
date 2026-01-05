import { t } from "@/lib/i18n";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberRole } from "@/types";
import { Loader2, Mail, Shield, UserCheck, User, Star } from "lucide-react";

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (email: string, role: MemberRole) => Promise<void>;
  loading: boolean;
}

const roleOptions: { value: MemberRole; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "CHAIR", label: "", icon: Shield },
  { value: "META_REVIEWER", label: "", icon: Star },
  { value: "REVIEWER", label: "", icon: UserCheck },
  { value: "AUTHOR", label: "", icon: User },
];

export function AddMemberModal({
  open,
  onOpenChange,
  onAdd,
  loading,
}: AddMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("AUTHOR");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    await onAdd(email.trim(), role);
    setEmail("");
    setRole("AUTHOR");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">{t("email.label")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={t("email.placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Role Select */}
          <div className="space-y-2">
            <Label>{t("role.label")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as MemberRole)} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={t("role.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  const label = t(`role.options.${option.value.toLowerCase()}`);
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Role Description Cards */}
          <div className="grid gap-2">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = role === option.value;
                  const label = t(`role.options.${option.value.toLowerCase()}`);
              return (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                        <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">
                          {option.value === "CHAIR" && t("role.hints.chair")}
                          {option.value === "META_REVIEWER" && "Can create meta-reviews and participate in PC discussions"}
                          {option.value === "REVIEWER" && t("role.hints.reviewer")}
                          {option.value === "AUTHOR" && t("role.hints.author")}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("actions.loading")}
                </>
              ) : (
                t("actions.submit")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

