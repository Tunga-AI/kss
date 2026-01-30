import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function B2BPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">B2B Users</CardTitle>
          <CardDescription className="text-primary-foreground/80">Manage B2B users.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
