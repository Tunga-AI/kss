import { LearnerProgramView } from "@/components/dashboard/learner-program-view";

export default function LearnerCoursesPage() {
    return (
        <LearnerProgramView
            pageTitle="Core & Short Courses"
            pageDescription="Browse all available courses. Find your next learning opportunity."
            programTypes={['Core', 'Short']}
        />
    );
}
