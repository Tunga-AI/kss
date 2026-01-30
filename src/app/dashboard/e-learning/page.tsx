import { LearnerProgramView } from "@/components/dashboard/learner-program-view";

export default function LearnerElearningPage() {
    return (
        <LearnerProgramView
            pageTitle="E-Learning Courses"
            pageDescription="Explore our free, self-paced e-learning modules."
            programTypes={['E-Learning']}
        />
    );
}
