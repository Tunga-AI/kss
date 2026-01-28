import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinanceDashboardPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Finance Dashboard</CardTitle>
          <CardDescription className="text-primary-foreground/80">Overview of financial data.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
