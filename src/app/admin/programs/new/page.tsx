'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { CourseForm } from '../course-form';
import { EventForm } from '../event-form';
import type { Course } from '@/lib/courses-data';
import type { Event } from '@/lib/events-data';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function CreateProgram() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type');

    if (type === 'core' || type === 'elearning') {
        const emptyCourse: Course = {
            id: '',
            title: '',
            description: '',
            imageId: '',
            duration: '',
            level: 'Beginner',
            takeaways: [],
            price: type === 'elearning' ? 'Free' : ''
        };
        return <CourseForm course={emptyCourse} type={type === 'core' ? 'Core Course' : 'E-Learning'} />;
    }

    if (type === 'event') {
        const emptyEvent: Event = {
            id: '',
            title: '',
            description: '',
            imageId: '',
            date: '',
            time: '',
            location: '',
            price: 'Free',
            speakers: []
        };
        return <EventForm event={emptyEvent} />;
    }

    return (
        <Card className="text-center">
            <CardHeader>
                <CardTitle>Invalid Program Type</CardTitle>
                <CardDescription>Please select a valid program type to create from the programs page.</CardDescription>
            </CardHeader>
        </Card>
    )
}


export default function CreateProgramPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <CreateProgram />
        </React.Suspense>
    )
};
