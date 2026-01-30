import { LearnerProgramView } from "@/components/dashboard/learner-program-view";

export default function LearnerEventsPage() {
    return (
        <LearnerProgramView
            pageTitle="Upcoming Events"
            pageDescription="Join our webinars, workshops, and conferences."
            programTypes={['Event']}
        />
    );
}
