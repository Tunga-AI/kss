'use client';
import { LearnerProgramView } from "@/components/dashboard/learner-program-view";

export default function LearnerProgramsPage() {
    return (
        <LearnerProgramView
            pageTitle="All Programs"
            pageDescription="Browse our comprehensive list of Core, Short, and E-Learning programs."
            programTypes={['Core', 'Short', 'E-Learning']}
        />
    );
}
