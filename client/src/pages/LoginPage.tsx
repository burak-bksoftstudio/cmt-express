import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">C</span>
          </div>
          <span className="text-xl font-bold">CMT</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Sign In */}
      <main className="flex flex-1 items-center justify-center p-6">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
        />
      </main>
    </div>
  );
}
