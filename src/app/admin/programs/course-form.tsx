'use client';
import type { Course } from '@/lib/courses-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CourseForm({ course, type }: { course: Course, type: 'Core Course' | 'E-Learning' }) {
    const isNew = !course.id;
    return (
        <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
                 <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">{isNew ? 'Create' : 'Edit'} {type}</CardTitle>
                    <CardDescription className="text-primary-foreground/80">{isNew ? `Enter the details for the new ${type}.` : `Make changes to the "${course.title}" details below.`}</CardDescription>
                </CardHeader>
            </Card>
            <Card>
                <CardContent className="pt-6">
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
                        {type === 'Core Course' && <div className="grid gap-3">
                            <Label htmlFor="price">Price</Label>
                            <Input id="price" type="text" defaultValue={course.price} />
                        </div>}
                        <div className="flex gap-4">
                            <Button type="submit">Save Changes</Button>
                            <Button type="button" variant="outline">Cancel</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
