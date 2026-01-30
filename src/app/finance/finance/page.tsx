import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const transactions = [
    { learnerName: 'Ethan Hunt', program: 'Digital Prospecting', amount: 50000, currency: 'KES', status: 'Success', date: '2024-07-26', reference: 'T415826598' },
    { learnerName: 'Alice Wonder', program: 'Advanced Negotiation', amount: 75000, currency: 'KES', status: 'Success', date: '2024-07-28', reference: 'T987654321' },
    { name: 'Bob Builder', program: 'Sales Fundamentals 101', amount: 30000, currency: 'KES', status: 'Success', date: '2024-07-27', reference: 'T123456789' },
    { name: 'Charlie Brown', program: 'Digital Prospecting', amount: 50000, currency: 'KES', status: 'Pending', date: '2024-07-29', reference: 'T654987321' },
    { name: 'David Copperfield', program: 'CRM Mastery', amount: 45000, currency: 'KES', status: 'Failed', date: '2024-07-25', reference: 'T789123456' },
]

export default function FinancePage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Finance</CardTitle>
          <CardDescription className="text-primary-foreground/80">Monitor all financial transactions and revenue.</CardDescription>
        </CardHeader>
      </Card>
      <Card>
          <CardContent className="pt-6">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Learner</TableHead>
                          <TableHead>Program</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reference</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {transactions.map((tx) => (
                          <TableRow key={tx.reference}>
                              <TableCell>{tx.date}</TableCell>
                              <TableCell>{tx.learnerName}</TableCell>
                              <TableCell>{tx.program}</TableCell>
                              <TableCell>{tx.currency} {tx.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={tx.status === 'Success' ? 'default' : tx.status === 'Failed' ? 'destructive' : 'secondary'}>{tx.status}</Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
