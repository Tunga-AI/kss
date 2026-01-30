import Link from "next/link";
import { courses } from "@/lib/courses-data";
import { moocCourses } from "@/lib/mooc-data";
import { events } from "@/lib/events-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export default function AdminProgramsPage() {
    const allPrograms = [
        ...courses.map(c => ({ ...c, type: 'Core Course', programId: c.id, date: null, location: c.price })),
        ...moocCourses.map(c => ({ ...c, type: 'E-Learning', programId: c.id, date: null, location: c.price })),
        ...events.map(e => ({ ...e, type: 'Event', programId: e.id, level: format(new Date(e.date), 'MMM d, yyyy') })),
    ];

    return (
        <div className="grid gap-6">
             <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline text-xl sm:text-2xl">Manage Programs</CardTitle>
                            <CardDescription className="text-primary-foreground/80">View, edit, or add new courses and events.</CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary">
                                    <PlusCircle className="mr-2"/>
                                    Create Program
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Program Type</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin/programs/new?type=core">Core Course</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin/programs/new?type=elearning">E-Learning Course</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin/programs/new?type=event">Event</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Level / Date</TableHead>
                                <TableHead className="hidden md:table-cell">Price / Location</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allPrograms.map((program) => (
                                <TableRow key={program.programId}>
                                    <TableCell className="font-medium">{program.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={program.type === 'Event' ? 'default' : 'secondary'}>{program.type}</Badge>
                                    </TableCell>
                                    <TableCell>{program.level}</TableCell>
                                    <TableCell className="hidden md:table-cell">{program.location}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem className="p-0">
                                                    <Link href={`/admin/programs/${program.programId}`} className="w-full h-full block px-2 py-1.5">
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
