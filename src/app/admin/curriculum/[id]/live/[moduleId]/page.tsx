import { use } from 'react';
import { ImmersiveLiveClass } from '@/components/classroom/immersive-live-class';

export default function AdminLiveCoursePlayer({ params }: { params: Promise<{ id: string, moduleId: string }> }) {
    const { id, moduleId } = use(params);
    return <ImmersiveLiveClass courseId={id} moduleId={moduleId} backUrl={`/admin/curriculum/${id}`} />;
}
