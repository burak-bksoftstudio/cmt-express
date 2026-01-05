
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User } from "@/types";

interface UserAvatarGroupProps {
  users: (User | { firstName: string; lastName: string; email?: string })[];
  max?: number;
  size?: "sm" | "md" | "lg";
  showNames?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function UserAvatarGroup({
  users,
  max = 4,
  size = "md",
  showNames = false,
  className,
}: UserAvatarGroupProps) {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {displayUsers.map((user, index) => (
          <Avatar
            key={index}
            className={cn(
              sizeClasses[size],
              "border-2 border-background ring-0"
            )}
          >
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
        ))}
        {remaining > 0 && (
          <Avatar
            className={cn(
              sizeClasses[size],
              "border-2 border-background ring-0"
            )}
          >
            <AvatarFallback className="bg-muted text-muted-foreground font-medium">
              +{remaining}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      {showNames && displayUsers.length > 0 && (
        <div className="ml-3 text-sm">
          <span className="font-medium">
            {displayUsers.map(u => `${u.firstName} ${u.lastName}`).join(", ")}
          </span>
          {remaining > 0 && (
            <span className="text-muted-foreground"> +{remaining} more</span>
          )}
        </div>
      )}
    </div>
  );
}

