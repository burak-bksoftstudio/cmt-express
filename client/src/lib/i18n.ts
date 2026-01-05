/**
 * Temporary mock translation function.
 * Returns the last part of the key in a readable format.
 *
 * Example: t("sidebar.dashboard") -> "Dashboard"
 * Example: t("common.actions.save") -> "Save"
 *
 * This will be replaced with react-i18next later.
 */
export function t(key: string, _params?: Record<string, unknown>): string {
  // Get the last part of the key
  const parts = key.split(".");
  const lastPart = parts[parts.length - 1];

  // Convert camelCase to Title Case
  const readable = lastPart
    .replace(/([A-Z])/g, " $1") // Add space before capitals
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();

  return readable;
}

// Add rich text support (returns string for now)
t.rich = (key: string, _params?: Record<string, unknown>): string => {
  return t(key);
};

/**
 * Hook-style wrapper for consistency with future react-i18next migration
 */
export function useTranslations(_namespace?: string) {
  return t;
}
