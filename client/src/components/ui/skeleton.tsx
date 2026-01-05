import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "after:absolute after:inset-0",
        "after:bg-linear-to-r after:from-transparent after:via-muted-foreground/5 after:to-transparent",
        "after:animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
