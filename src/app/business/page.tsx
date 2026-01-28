import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BusinessDashboardPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Business Dashboard</CardTitle>
          <CardDescription className="text-primary-foreground/80">Overview for B2B users.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
