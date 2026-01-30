'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { ProgramForm } from '../program-form';
import type { Program } from '@/lib/program-types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function CreateProgram() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type');

    let programType: Program['programType'] | null = null;
    if (type === 'core') programType = 'Core Course';
    if (type === 'elearning') programType = 'E-Learning';
    if (type === 'event') programType = 'Event';
    if (type === 'shortcourse') programType = 'Short Course';

    if (programType) {
        const emptyProgram: Partial<Program> = {
            title: '',
            description: '',
            imageId: '',
            programType: programType,
            level: 'Beginner',
            takeaways: [],
            price: programType === 'E-Learning' ? 'Free' : '',
            speakers: [],
        };
        return <ProgramForm program={emptyProgram} />;
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
