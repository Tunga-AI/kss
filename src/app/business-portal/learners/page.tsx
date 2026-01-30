import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function BusinessLearnersPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="font-headline text-xl sm:text-2xl">Manage Learners</CardTitle>
                <CardDescription className="text-primary-foreground/80">Add, invite, and manage learners in your organization.</CardDescription>
              </div>
              <Button variant="secondary">
                  <PlusCircle className="mr-2"/>
                  Add Learner
              </Button>
          </div>
        </CardHeader>
      </Card>
      <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Learner management functionality coming soon.</p>
          </CardContent>
      </Card>
    </div>
  );
}
