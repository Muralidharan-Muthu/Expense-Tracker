import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/hooks/useSession";

/** Shows the children only to a signed-in user, otherwise a sign-in invitation. */
export function RequireSession({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <Card>
          <CardContent className="space-y-4 pt-6 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Lock className="size-5" />
            </span>
            <h2 className="text-lg font-semibold">Your sheet is private</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to see your expenses. Only you can read or change your amounts.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth">Sign in or create an account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
