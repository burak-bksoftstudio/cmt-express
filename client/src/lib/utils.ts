import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getDeadlineStatus(deadline: string | null | undefined): {
  status: "safe" | "warning" | "danger" | "passed";
  daysLeft: number | null;
  message: string;
} {
  if (!deadline) {
    return { status: "safe", daysLeft: null, message: "No deadline set" };
  }

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: "passed", daysLeft: diffDays, message: "Deadline passed" };
  }
  if (diffDays <= 1) {
    return { status: "danger", daysLeft: diffDays, message: `${diffDays} day left` };
  }
  if (diffDays <= 3) {
    return { status: "warning", daysLeft: diffDays, message: `${diffDays} days left` };
  }
  return { status: "safe", daysLeft: diffDays, message: `${diffDays} days left` };
}

export function getBidLevelColor(level: string): string {
  switch (level) {
    case "high":
      return "bg-green-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-orange-500";
    case "no_bid":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "submitted":
      return "bg-blue-500";
    case "under_review":
      return "bg-yellow-500";
    case "accepted":
      return "bg-green-500";
    case "rejected":
      return "bg-red-500";
    case "revision":
      return "bg-orange-500";
    case "pending":
      return "bg-gray-500";
    case "completed":
      return "bg-green-500";
    case "approved":
      return "bg-green-500";
    case "needs_revision":
      return "bg-orange-500";
    default:
      return "bg-gray-500";
  }
}

export function getRecommendationLabel(recommendation: string): string {
  const labels: Record<string, string> = {
    accept: "Accept",
    weak_accept: "Weak Accept",
    borderline: "Borderline",
    weak_reject: "Weak Reject",
    reject: "Reject",
  };
  return labels[recommendation] || recommendation;
}
