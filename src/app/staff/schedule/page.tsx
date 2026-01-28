import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const scheduleData = {
    "Monday": [
        { time: "10:00 AM", course: "Sales 101", type: "Live Q&A" },
        { time: "02:00 PM", course: "CRM Mastery", type: "Office Hours" },
    ],
    "Tuesday": [
        { time: "11:00 AM", course: "Digital Prospecting", type: "Module Kick-off" },
    ],
    "Wednesday": [
        { time: "10:00 AM", course: "Sales 101", type: "Grading Block" },
        { time: "01:00 PM", course: "Advanced Negotiation", type: "Live Session" },
    ],
    "Thursday": [
         { time: "03:00 PM", course: "CRM Mastery", type: "Live Session" },
    ],
    "Friday": [
        { time: "09:00 AM", course: "Digital Prospecting", type: "Office Hours" },
        { time: "11:00 AM", course: "Advanced Negotiation", type: "Grading Block" },
    ]
}

const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];


export default function StaffSchedulePage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl sm:text-2xl">My Weekly Schedule</CardTitle>
                <CardDescription>An overview of your teaching and administrative commitments for the week.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Time</TableHead>
                            {days.map(day => <TableHead key={day}>{day}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {timeSlots.map(time => (
                            <TableRow key={time}>
                                <TableCell className="font-medium text-muted-foreground">{time}</TableCell>
                                {days.map(day => {
                                    const event = scheduleData[day as keyof typeof scheduleData]?.find(e => e.time === time);
                                    return (
                                        <TableCell key={day} className="h-24 align-top">
                                            {event && (
                                                <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 h-full">
                                                    <p className="font-semibold text-primary text-sm">{event.course}</p>
                                                    <p className="text-xs text-muted-foreground">{event.type}</p>
                                                </div>
                                            )}
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
    );
}
