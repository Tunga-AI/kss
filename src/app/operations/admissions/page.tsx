import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const admissions = [
    { name: 'Alice Wonder', program: 'Advanced Negotiation', status: 'Admitted', date: '2024-07-28' },
    { name: 'Bob Builder', program: 'Sales Fundamentals 101', status: 'Admitted', date: '2024-07-27' },
    { name: 'Charlie Brown', program: 'Digital Prospecting', status: 'Admitted', date: '2024-07-26' },
]

export default function AdmissionsPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Admissions</CardTitle>
          <CardDescription className="text-primary-foreground/80">Review newly admitted learners.</CardDescription>
        </CardHeader>
      </Card>
      <Card>
          <CardHeader>
              <CardTitle>Recently Admitted</CardTitle>
          </CardHeader>
          <CardContent>
               <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Learner</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Admission Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {admissions.map((admission) => (
                        <TableRow key={admission.name}>
                            <TableCell className="font-medium">{admission.name}</TableCell>
                            <TableCell>{admission.program}</TableCell>
                            <TableCell>
                                <Badge>{admission.status}</Badge>
                            </TableCell>
                            <TableCell>{admission.date}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
      </Card>
    </div>
  );
}
