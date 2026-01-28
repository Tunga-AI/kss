import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancePage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Finance</CardTitle>
          <CardDescription className="text-primary-foreground/80">Manage finances.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
