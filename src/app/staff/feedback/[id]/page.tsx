'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Send } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import type { FeedbackCycle, FeedbackAnswer } from '@/lib/feedback-types';
import { addFeedbackResponse } from '@/lib/feedback';
import { Badge } from '@/components/ui/badge';

export default function StaffSubmitFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const feedbackDoc = firestore ? doc(firestore, 'feedbackCycles', id) : null;
  const { data: feedback, loading } = useDoc<FeedbackCycle>(feedbackDoc as any);

  const [answers, setAnswers] = useState<{ [questionId: string]: string | number }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !feedback) return;

    // Validate required questions
    const missingRequired = feedback.questions.filter(
      q => q.required && !answers[q.id]
    );

    if (missingRequired.length > 0) {
      alert(`Please answer all required questions (${missingRequired.length} missing)`);
      return;
    }

    setSubmitting(true);
    try {
      const feedbackAnswers: FeedbackAnswer[] = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      await addFeedbackResponse(firestore, {
        feedbackCycleId: feedback.id,
        respondentId: feedback.anonymousResponses ? '' : user.id,
        respondentName: feedback.anonymousResponses ? undefined : user.name,
        respondentRole: feedback.anonymousResponses ? undefined : user.role,
        answers: feedbackAnswers,
        submittedAt: Timestamp.now(),
        isAnonymous: feedback.anonymousResponses,
      });

      alert('Thank you for your feedback!');
      router.push('/staff/feedback');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <p className="text-primary/60 mb-4">Feedback not found</p>
          <Link href="/staff/feedback" className="text-primary hover:underline">
            Back to Feedback
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/staff/feedback"
            className="inline-flex items-center text-primary hover:text-primary/80 font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feedback
          </Link>
          <Card className="p-6 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none bg-primary text-white">
            <h1 className="text-2xl font-bold mb-2">{feedback.title}</h1>
            <p className="text-white/80 mb-4">{feedback.description}</p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white border-none">
                {feedback.type.toUpperCase()}
              </Badge>
              {feedback.anonymousResponses && (
                <Badge className="bg-white/20 text-white border-none">
                  Anonymous
                </Badge>
              )}
              <Badge className="bg-white/20 text-white border-none">
                {feedback.questions.length} Questions
              </Badge>
            </div>
          </Card>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {feedback.questions.map((question, index) => (
            <Card key={question.id} className="p-6 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
              <Label className="text-base font-bold text-primary mb-4 block">
                {index + 1}. {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {/* Text Response */}
              {question.type === 'text' && (
                <Textarea
                  value={answers[question.id] as string || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.required}
                  className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                  rows={4}
                  placeholder="Type your answer here..."
                />
              )}

              {/* Rating Scale */}
              {question.type === 'rating' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-primary/60">
                    <span>1 (Poor)</span>
                    <span>{question.ratingScale || 5} (Excellent)</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: question.ratingScale || 5 }, (_, i) => i + 1).map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleAnswerChange(question.id, rating)}
                        className={`w-12 h-12 rounded-tl-lg rounded-br-lg font-bold transition-all ${
                          answers[question.id] === rating
                            ? 'bg-accent text-white scale-110'
                            : 'bg-gray-100 text-primary hover:bg-gray-200'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Multiple Choice */}
              {question.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {question.options?.map((option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 p-4 rounded-tl-lg rounded-br-lg border-2 cursor-pointer transition-all ${
                        answers[question.id] === option
                          ? 'border-accent bg-accent/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        required={question.required}
                        className="text-accent focus:ring-accent"
                      />
                      <span className="font-medium text-primary">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Yes/No */}
              {question.type === 'yes_no' && (
                <div className="grid grid-cols-2 gap-4">
                  {['Yes', 'No'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleAnswerChange(question.id, option)}
                      className={`p-4 rounded-tl-lg rounded-br-lg font-bold transition-all ${
                        answers[question.id] === option
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-primary hover:bg-gray-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/staff/feedback')}
              className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-accent hover:bg-accent/90 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
