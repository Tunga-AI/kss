import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OperationsDashboardPage() {
  return (
    <div className="grid gap-6 p-4 sm:p-6 lg:p-10">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Operations Dashboard</CardTitle>
          <CardDescription className="text-primary-foreground/80">Manage institute operations.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
