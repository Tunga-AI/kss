import { notFound } from 'next/navigation';
import { courses } from '@/lib/courses-data';
import { moocCourses } from '@/lib/mooc-data';
import { events } from '@/lib/events-data';
import { CourseForm } from '../course-form';
import { EventForm } from '../event-form';

export default function EditProgramPage({ params }: { params: { id: string } }) {
    const course = courses.find((c) => c.id === params.id)
    const mooc = moocCourses.find((c) => c.id === params.id);
    const event = events.find((e) => e.id === params.id);
    
    const program = course || mooc;

    if (program) {
        const isMooc = moocCourses.some(c => c.id === params.id);
        return <CourseForm course={program} type={isMooc ? 'E-Learning' : 'Core Course'} />;
    }

    if (event) {
        return <EventForm event={event} />;
    }

    notFound();
}
