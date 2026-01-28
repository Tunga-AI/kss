import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CrmPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">CRM</CardTitle>
          <CardDescription className="text-primary-foreground/80">Manage your customer relationships.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
