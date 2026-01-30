'use client';
import { useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ClassroomSession } from '@/lib/classroom-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Video, UploadCloud, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function LearnerSessionPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();

    const sessionRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'classroom', id);
    }, [firestore, id]);

    const { data: session, loading } = useDoc<ClassroomSession>(sessionRef);

    if (loading) {
        return (
            <div className="grid gap-6">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!session) {
        notFound();
    }

    return (
        <div className="grid gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h1 className="font-headline text-xl sm:text-2xl font-bold">{session.title}</h1>
                    <p className="text-muted-foreground">
                        {session.startDateTime ? format(session.startDateTime.toDate(), 'MMM d, yyyy h:mm a') : 'Date not set'}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Video /> Live Session</CardTitle>
                    <CardDescription>This is where the live video session will take place.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                        <p>WebRTC Video Component Placeholder</p>
                    </div>
                </CardContent>
            </Card>

             <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UploadCloud /> Session Materials</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Any uploaded materials for this session will appear here.</p>
                        {/* Placeholder for material list */}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users /> Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">The list of participants will appear here.</p>
                         {/* Placeholder for participant list */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
