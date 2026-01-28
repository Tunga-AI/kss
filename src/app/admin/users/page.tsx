import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const users = [
    {
        name: "John Doe",
        email: "john.doe@example.com",
        role: "Learner",
        joined: "2023-10-23",
        avatar: "https://picsum.photos/seed/user1/40/40"
    },
    {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        role: "Learner",
        joined: "2023-11-15",
        avatar: "https://picsum.photos/seed/user2/40/40"
    },
    {
        name: "Admin User",
        email: "admin@kss.com",
        role: "Admin",
        joined: "2023-01-01",
        avatar: "https://picsum.photos/seed/admin/40/40"
    },
    {
        name: "Michael Johnson",
        email: "michael.j@example.com",
        role: "Learner",
        joined: "2024-02-01",
        avatar: "https://picsum.photos/seed/user3/40/40"
    },
    {
        name: "Sarah Williams",
        email: "sarah.w@example.com",
        role: "Staff",
        joined: "2023-05-20",
        avatar: "https://picsum.photos/seed/user4/40/40"
    }
]

export default function AdminUsersPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline text-xl sm:text-2xl">Manage Users</CardTitle>
                            <CardDescription>View, edit, or add new users to the system.</CardDescription>
                        </div>
                        <Button>
                            <PlusCircle className="mr-2"/>
                            Create User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="hidden sm:table-cell">Date Joined</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.email}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'Admin' ? 'destructive' : user.role === 'Staff' ? 'default' : 'secondary'}>{user.role}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{user.joined}</TableCell>
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
                                                <DropdownMenuItem>Change Role</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
