'use client';
import type { Event } from '@/lib/events-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function EventForm({ event }: { event: Event }) {
    const isNew = !event.id;
    return (
        <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">{isNew ? 'Create' : 'Edit'} Event</CardTitle>
                    <CardDescription className="text-primary-foreground/80">{isNew ? 'Enter the details for the new event.' : `Make changes to the "${event.title}" event details below.`}</CardDescription>
                </CardHeader>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <form className="grid gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" type="text" defaultValue={event.title} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" defaultValue={event.description} rows={5} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" defaultValue={event.date} />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="time">Time</Label>
                                <Input id="time" type="text" defaultValue={event.time} />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="price">Price</Label>
                                <Input id="price" type="text" defaultValue={event.price} />
                            </div>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" type="text" defaultValue={event.location} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="speakers">Speakers (Name, Title - one per line)</Label>
                            <Textarea id="speakers" defaultValue={event.speakers.map(s => `${s.name}, ${s.title}`).join('\n')} rows={4} />
                        </div>
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
