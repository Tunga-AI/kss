import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";

export default function LearnerClassroomPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">My Classroom</CardTitle>
          <CardDescription className="text-primary-foreground/80">Join your live sessions and access class materials.</CardDescription>
        </CardHeader>
      </Card>
      <Card className="text-center h-96 flex flex-col justify-center items-center">
        <CardHeader>
            <Video className="h-16 w-16 mx-auto text-muted-foreground" />
            <CardTitle className="mt-4">Coming Soon!</CardTitle>
            <CardDescription>We're building this section for your live classes.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">You will be able to see your class schedule and join live sessions from here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
