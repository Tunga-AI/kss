'use client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    Calendar,
    Users,
    Video,
    MapPin,
    FileText,
    Link as LinkIcon
} from 'lucide-react';
import type { ClassroomSession } from '@/lib/classroom-types';
import { format } from 'date-fns';
import Link from 'next/link';

interface SessionDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: ClassroomSession | null;
}

export function SessionDetailsDialog({ open, onOpenChange, session }: SessionDetailsDialogProps) {
    if (!session) return null;

    const isVirtual = session.type === 'Virtual' || session.type === 'Hybrid';
    const isPhysical = session.type === 'Physical' || session.type === 'Hybrid';

    // Helper to format date/time
    const formatDate = (ts: any) => format(ts.toDate(), 'EEEE, MMMM do, yyyy');
    const formatTime = (ts: any) => format(ts.toDate(), 'h:mm a');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white" aria-describedby={undefined}>
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={
                            session.type === 'Virtual' ? "bg-blue-100 text-blue-700 border-none" :
                                session.type === 'Physical' ? "bg-orange-100 text-orange-700 border-none" :
                                    "bg-purple-100 text-purple-700 border-none"
                        }>
                            {session.type}
                        </Badge>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-none">{session.status}</Badge>
                    </div>
                    <DialogTitle className="text-xl font-bold text-primary">{session.title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Time & Date */}
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/5 p-2 rounded-lg text-primary">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Time</p>
                            <p className="font-medium text-sm">{formatDate(session.startDateTime)}</p>
                            <p className="text-sm font-bold text-primary">
                                {formatTime(session.startDateTime)} - {formatTime(session.endDateTime)}
                            </p>
                        </div>
                    </div>

                    {/* Location / Link */}
                    {isVirtual && (
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                <Video className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Virtual Classroom</p>
                                <Link
                                    href={`/l/classroom/${session.id}`}
                                    className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                >
                                    <LinkIcon className="h-3 w-3" />
                                    Enter Class Room
                                </Link>
                                <p className="text-xs text-blue-400 mt-1">Live video session</p>
                            </div>
                        </div>
                    )}

                    {(isPhysical && session.location) && (
                        <div className="flex items-start gap-3">
                            <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Location</p>
                                <p className="text-sm font-medium text-gray-700 mt-1">{session.location}</p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {session.description && (
                        <div className="flex items-start gap-3">
                            <div className="bg-gray-50 p-2 rounded-lg text-gray-500">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Details</p>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">{session.description}</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    {isVirtual && (
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                            <Link href={`/l/classroom/${session.id}`}>
                                Join Live Class
                            </Link>
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
