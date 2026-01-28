import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Welcome Back, Learner!</CardTitle>
          <CardDescription className="text-primary-foreground/80">Here's a quick overview of your learning journey. Keep up the great work!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl sm:text-3xl">3</CardTitle>
                <CardDescription>Courses in Progress</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl sm:text-3xl">88%</CardTitle>
                <CardDescription>Average Score</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl sm:text-3xl">5</CardTitle>
                <CardDescription>Completed Courses</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
            <CardTitle className="font-headline">Start Your Next Course</CardTitle>
            <CardDescription>Ready to dive back in? Pick up where you left off in your most recent course.</CardDescription>
        </CardHeader>
        <CardContent>
            <h3 className="font-semibold">Advanced Negotiation Tactics</h3>
            <p className="text-sm text-muted-foreground mt-1">You are 45% through the course. Next up: "Handling Objections".</p>
        </CardContent>
        <CardContent>
             <Button asChild>
                <Link href="/dashboard/courses/advanced-negotiation">Continue Learning <ArrowRight className="ml-2 h-4 w-4"/></Link>
             </Button>
        </CardContent>
       </Card>
    </div>
  );
}
