'use client';

import { use } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { FeedbackForm } from '../feedback-form';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { FeedbackCycle } from '@/lib/feedback-types';

export default function EditFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const firestore = useFirestore();

  const feedbackDoc = firestore ? doc(firestore, 'feedbackCycles', id) : null;
  const { data: feedback, loading } = useDoc<FeedbackCycle>(feedbackDoc as any);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-primary/60 mb-4">Feedback cycle not found</p>
          <Link href="/admin/feedback" className="text-primary hover:underline">
            Back to Feedback
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/feedback"
            className="inline-flex items-center text-primary hover:text-primary/80 font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feedback
          </Link>
          <h1 className="text-3xl font-bold text-primary">Edit Feedback Cycle</h1>
          <p className="text-primary/60 mt-2">
            Modify the feedback cycle details and questions
          </p>
        </div>

        <FeedbackForm feedback={feedback} />
      </div>
    </div>
  );
}
