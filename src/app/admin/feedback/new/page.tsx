'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FeedbackForm } from '../feedback-form';

export default function NewFeedbackPage() {
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
          <h1 className="text-3xl font-bold text-primary">Create New Feedback Cycle</h1>
          <p className="text-primary/60 mt-2">
            Design a feedback cycle to collect insights from your users
          </p>
        </div>

        <FeedbackForm />
      </div>
    </div>
  );
}
