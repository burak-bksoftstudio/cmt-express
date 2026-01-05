
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PaperAuthor, User } from "@/types";
import { Users, Mail, Crown, Hash } from "lucide-react";
import { useMemo } from "react";

interface AuthorsSectionProps {
  authors: (PaperAuthor & { user?: Partial<User> })[];
}

export function AuthorsSection({ authors }: AuthorsSectionProps) {
  // Sort authors by order ASC
  const sortedAuthors = useMemo(() => {
    if (!authors || authors.length === 0) return [];
    return [...authors].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [authors]);

  // Get initials from name
  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first + last || "??";
  };

  // Get avatar background color based on name
  const getAvatarColor = (firstName?: string, lastName?: string): string => {
    const name = `${firstName || ""}${lastName || ""}`;
    const colors = [
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Empty state
  if (sortedAuthors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Authors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No authors found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              This paper doesn&#39;t have any authors listed yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Authors
            </CardTitle>
            <CardDescription>
              Listed in order of contribution
            </CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {sortedAuthors.length} author{sortedAuthors.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        <div className="space-y-4">
          {sortedAuthors.map((author, index) => {
            const isPrimary = author.order === 1 || index === 0;
            const fullName = `${author.user?.firstName || "Unknown"} ${author.user?.lastName || "Author"}`;

            return (
              <div
                key={author.id}
                className={`group relative rounded-lg border p-4 transition-all hover:shadow-xs ${
                  isPrimary
                    ? "border-primary/30 bg-primary/5 dark:bg-primary/10"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Order Badge - Absolute positioned */}
                  <div className="absolute -top-2 -left-2">
                    <Badge
                      variant={isPrimary ? "default" : "outline"}
                      className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                    >
                      {author.order || index + 1}
                    </Badge>
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-14 w-14 shrink-0 border-2 border-background shadow-xs">
                    <AvatarFallback
                      className={`text-lg font-semibold ${getAvatarColor(
                        author.user?.firstName,
                        author.user?.lastName
                      )}`}
                    >
                      {getInitials(author.user?.firstName, author.user?.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Author Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">
                        {fullName}
                      </h4>
                      {isPrimary && (
                        <Badge
                          variant="default"
                          className="text-[10px] px-1.5 py-0 h-5 gap-1"
                        >
                          <Crown className="h-3 w-3" />
                          Primary
                        </Badge>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {author.user?.email || "No email provided"}
                      </span>
                    </div>

                    {/* Author Order Info */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3 shrink-0" />
                      <span>Author #{author.order || index + 1}</span>
                    </div>
                  </div>

                  {/* Right side badges - visible on larger screens */}
                  <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs font-normal">
                      #{author.order || index + 1} in order
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Total: {sortedAuthors.length} author{sortedAuthors.length !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1">
              <Crown className="h-3.5 w-3.5" />
              Primary: {sortedAuthors[0]?.user?.firstName} {sortedAuthors[0]?.user?.lastName}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
