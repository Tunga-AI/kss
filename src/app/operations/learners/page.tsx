import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const learners = [
    {
        name: "John Doe",
        email: "john.doe@example.com",
        program: "Advanced Negotiation",
        status: "Active",
        joined: "2023-10-23",
        avatar: "https://picsum.photos/seed/user1/40/40"
    },
    {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        program: "Sales Fundamentals 101",
        status: "Active",
        joined: "2023-11-15",
        avatar: "https://picsum.photos/seed/user2/40/40"
    },
    {
        name: "Michael Johnson",
        email: "michael.j@example.com",
        program: "Digital Prospecting",
        status: "Inactive",
        joined: "2024-02-01",
        avatar: "https://picsum.photos/seed/user3/40/40"
    },
     {
        name: "Emily Davis",
        email: "emily.d@example.com",
        program: "Sales Fundamentals 101",
        status: "Alumni",
        joined: "2022-08-10",
        avatar: "https://picsum.photos/seed/user5/40/40"
    },
];

export default function OperationsLearnersPage() {
    return (
        <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline text-xl sm:text-2xl">Manage Learners</CardTitle>
                            <CardDescription className="text-primary-foreground/80">View and manage all enrolled learners.</CardDescription>
                        </div>
                        <Button variant="secondary">
                            <PlusCircle className="mr-2"/>
                            Add Learner
                        </Button>
                    </div>
                </CardHeader>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Learner</TableHead>
                                <TableHead>Program</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden sm:table-cell">Date Joined</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {learners.map((learner) => (
                                <TableRow key={learner.email}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={learner.avatar} alt={learner.name} />
                                                <AvatarFallback>{learner.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{learner.name}</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground">{learner.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{learner.program}</TableCell>
                                    <TableCell>
                                        <Badge variant={learner.status === 'Active' ? 'default' : 'secondary'}>{learner.status}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{learner.joined}</TableCell>
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
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem>Change Status</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
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
