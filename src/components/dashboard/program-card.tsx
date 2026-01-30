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

    const getProgramUrl = () => {
        switch (program.programType) {
            case 'Core':
            case 'Short':
                return `/l/courses/${program.slug}`;
            case 'E-Learning':
                return `/l/e-learning/${program.slug}`;
            case 'Event':
                return `/l/events/${program.slug}`;
            default:
                return '#';
        }
    };

    return (
        <Card className="flex flex-col">
            <CardHeader className="p-0">
                <div className="relative h-48 w-full rounded-t-lg bg-muted">
                    {program.imageUrl ? (
                        <Image
                            src={program.imageUrl}
                            alt={program.title}
                            fill
                            className="object-cover rounded-t-lg"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-16 w-16 text-muted-foreground" />
                        </div>
                    )}
                    {isEnrolled && (
                        <Badge className="absolute top-2 right-2" variant="default">Enrolled</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-4">
                <Badge variant="secondary" className="mb-2">{program.programType}</Badge>
                <CardTitle className="font-headline text-lg mb-2">{program.title}</CardTitle>
            </CardContent>
            <CardFooter className="p-4">
                <Button asChild className="w-full">
                    <Link href={getProgramUrl()}>
                        {isEnrolled ? 'Continue' : 'View Details'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
