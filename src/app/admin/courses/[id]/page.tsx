import { notFound } from 'next/navigation';
import { courses } from '@/lib/courses-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminCourseEditPage({ params }: { params: { id: string } }) {
    const course = courses.find((c) => c.id === params.id);

    if (!course) {
        notFound();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl sm:text-2xl">Edit Course</CardTitle>
                <CardDescription>Make changes to the course details below.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="grid gap-6">
                    <div className="grid gap-3">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" type="text" defaultValue={course.title} />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" defaultValue={course.description} rows={5} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="level">Level</Label>
                            <Select defaultValue={course.level}>
                                <SelectTrigger id="level">
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="duration">Duration</Label>
                            <Input id="duration" type="text" defaultValue={course.duration} />
                        </div>
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="takeaways">Key Takeaways (one per line)</Label>
                        <Textarea id="takeaways" defaultValue={course.takeaways.join('\n')} rows={5} />
                    </div>
                    <div className="flex gap-4">
                        <Button type="submit">Save Changes</Button>
                        <Button type="button" variant="outline">Cancel</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
