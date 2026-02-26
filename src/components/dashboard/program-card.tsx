'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Program } from '@/lib/program-types';
import { ArrowRight, ImageIcon } from 'lucide-react';

interface LearnerProgramCardProps {
    program: Program;
    isEnrolled: boolean;
}

export function LearnerProgramCard({ program, isEnrolled }: LearnerProgramCardProps) {

    const programType = program.programType || 'Short'; // Default to Short if not specified for now

    const getProgramUrl = () => {
        switch (programType) {
            case 'Core':
            case 'Short':
                return `/l/courses/${program.slug}`;
            case 'E-Learning':
                return `/l/e-learning/${program.slug}`;
            case 'Event':
                return `/l/events/${program.slug}`;
            default:
                return `/l/courses/${program.slug}`;
        }
    };

    // Prefer new schema fields, fall back to old
    const imageUrl = program.image || program.imageUrl;
    const title = program.programName || program.title || 'Untitled Program';

    return (
        <Card className="flex flex-col h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative h-48 w-full bg-muted">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <ImageIcon className="h-12 w-12 text-gray-300" />
                    </div>
                )}
                {isEnrolled && (
                    <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-white border-0 shadow-sm" variant="default">
                        Enrolled
                    </Badge>
                )}
                {programType && (
                    <Badge variant="secondary" className="absolute top-2 left-2 bg-white/90 text-primary backdrop-blur-sm shadow-sm border-0">
                        {programType}
                    </Badge>
                )}
            </div>

            <CardHeader className="p-5 pb-2">
                <CardTitle className="font-headline text-lg line-clamp-2 min-h-[3.5rem] leading-tight text-primary">
                    {title}
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-grow px-5 py-2">
                {program.level && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                        Level {program.level}
                    </div>
                )}
                {program.shortDescription && (
                    <p className="text-sm text-gray-500 line-clamp-2">{program.shortDescription}</p>
                )}
            </CardContent>

            <CardFooter className="p-5 pt-2">
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-sm group">
                    <Link href={getProgramUrl()}>
                        {isEnrolled ? 'Continue Learning' : 'View Details'}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
