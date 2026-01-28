import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdmissionsPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Admissions</CardTitle>
          <CardDescription className="text-primary-foreground/80">Manage learner admissions.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
