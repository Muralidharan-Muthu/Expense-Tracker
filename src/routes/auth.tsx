import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lovable } from "@/integrations/lovable";
import { useSession } from "@/hooks/useSession";
import { LiWiseLogo } from "@/components/LiWiseLogo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LiWise" },
      {
        name: "description",
        content:
          "Sign in with your Google account to keep your daily expense sheet private to you.",
      },
      { property: "og:title", content: "Sign in — LiWise" },
      {
        property: "og:description",
        content: "Your expense sheet, income and balances stay visible only to you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();

  useEffect(() => {
    if (session) navigate({ to: "/", replace: true });
  }, [session, navigate]);

  async function handleGoogle() {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch {
      toast.error("Google sign-in could not start. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
      <div className="mb-6 flex justify-center">
        <LiWiseLogo />
      </div>
      <Card className="rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use your Google account to sign in or create your private expense workspace.
          </p>
          <Button className="w-full" onClick={handleGoogle} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
