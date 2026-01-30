import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function ProgressPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">My Progress</CardTitle>
          <CardDescription className="text-primary-foreground/80">Track your learning journey, achievements, and completed courses.</CardDescription>
        </CardHeader>
      </Card>
      <Card className="text-center h-96 flex flex-col justify-center items-center">
        <CardHeader>
            <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground" />
            <CardTitle className="mt-4">Coming Soon!</CardTitle>
            <CardDescription>We're building this page to help you visualize your progress.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
