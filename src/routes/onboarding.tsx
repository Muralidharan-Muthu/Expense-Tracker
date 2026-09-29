import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequireSession } from "@/components/auth/RequireSession";
import { LiWiseLogo } from "@/components/LiWiseLogo";
import { useProfile, useSaveProfile } from "@/lib/expense-data";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — LiWise" },
      { name: "description", content: "Tell us your name, age and profession to set up your private expense workspace." },
      { property: "og:title", content: "Welcome — LiWise" },
      { property: "og:description", content: "One-time setup for your LiWise account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <RequireSession>
      <OnboardingForm />
    </RequireSession>
  );
}

function OnboardingForm() {
  const navigate = useNavigate();
  const profile = useProfile();
  const save = useSaveProfile();

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [profession, setProfession] = useState("");

  // Prefill the name from the Google account once the profile loads.
  useEffect(() => {
    if (profile.data?.name && !fullName) setFullName(profile.data.name);
  }, [profile.data, fullName]);

  // Already completed onboarding before — go straight to the dashboard.
  useEffect(() => {
    if (profile.data && profile.data.age != null) navigate({ to: "/", replace: true });
  }, [profile.data, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ageNum = Number(age);
    if (!fullName.trim()) { toast.error("Please enter your full name."); return; }
    if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) { toast.error("Please enter a valid age."); return; }
    if (!profession.trim()) { toast.error("Please enter your profession."); return; }
    try {
      await save.mutateAsync({ fullName: fullName.trim(), age: ageNum, profession: profession.trim() });
      toast.success("You're all set!");
      navigate({ to: "/", replace: true });
    } catch {
      toast.error("Could not save your details. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
      <div className="mb-6 flex justify-center">
        <LiWiseLogo />
      </div>
      <Card className="rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-5 text-primary" />
            Welcome to LiWise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            One quick step before your dashboard — tell us a little about you. This is asked only once.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Muralidharan Muthu"
                maxLength={100}
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 24"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. Software Engineer"
                maxLength={100}
                autoComplete="organization-title"
              />
            </div>
            <Button type="submit" className="w-full" disabled={save.isPending || profile.isLoading}>
              {save.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save and open my dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
