import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CheckSquare, Clock, BookOpen } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const todaySchedule = [
    { time: "10:00 AM", course: "Sales Fundamentals 101", topic: "Live Q&A Session" },
    { time: "01:00 PM", course: "Advanced Negotiation Tactics", topic: "Office Hours" },
    { time: "03:00 PM", course: "Digital Prospecting & Lead Gen", topic: "Module 3 Kick-off" },
];

const pendingTasks = [
    { task: "Grade assignments for Sales 101, Module 2", due: "Tomorrow" },
    { task: "Prepare slides for Annual Sales Summit", due: "In 3 days" },
    { task: "Review learner feedback for CRM Mastery", due: "This week" },
]

export default function StaffDashboardPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Welcome Back, Staff!</CardTitle>
          <CardDescription className="text-primary-foreground/80">Here's what's on your plate today. Let's make it a productive one.</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline"><Clock /> Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Time</TableHead>
                            <TableHead>Session</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {todaySchedule.map(item => (
                            <TableRow key={item.time}>
                                <TableCell className="font-medium">{item.time}</TableCell>
                                <TableCell>
                                    <p className="font-semibold">{item.topic}</p>
                                    <p className="text-sm text-muted-foreground">{item.course}</p>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardContent>
                <Button asChild variant="secondary">
                    <Link href="/staff/schedule">View Full Schedule <ArrowRight className="ml-2"/></Link>
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline"><CheckSquare /> Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {pendingTasks.map((item, index) => (
                        <li key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted">
                            <p className="font-medium flex-grow">{item.task}</p>
                            <p className="text-sm text-muted-foreground sm:text-right flex-shrink-0">Due: {item.due}</p>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><BookOpen/> Class Management</CardTitle>
            <CardDescription>Quick access to manage your assigned classes.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="font-semibold">You are currently assigned to 4 courses.</p>
            <p className="text-sm text-muted-foreground mt-1">View rosters, post announcements, and manage course materials.</p>
        </CardContent>
        <CardContent>
             <Button asChild>
                <Link href="/staff/classes">Manage My Classes <ArrowRight className="ml-2"/></Link>
             </Button>
        </CardContent>
       </Card>
    </div>
  );
}
