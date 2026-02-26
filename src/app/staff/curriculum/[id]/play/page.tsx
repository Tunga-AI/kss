'use client';
import { use } from 'react';
import { CoursePlayer } from '@/components/shared/course-player';

export default function StaffCourseImmersivePlayer({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <CoursePlayer id={id} backUrl="/f/curriculum" />;
}
