import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";

export default function AdminClassroomPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Classroom Management</CardTitle>
          <CardDescription className="text-primary-foreground/80">Schedule, view, and manage all virtual classroom sessions.</CardDescription>
        </CardHeader>
      </Card>
      <Card className="text-center h-96 flex flex-col justify-center items-center">
        <CardHeader>
            <Video className="h-16 w-16 mx-auto text-muted-foreground" />
            <CardTitle className="mt-4">Coming Soon!</CardTitle>
            <CardDescription>We're building this section to manage live classrooms.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">You will be able to create class schedules and view session details here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
