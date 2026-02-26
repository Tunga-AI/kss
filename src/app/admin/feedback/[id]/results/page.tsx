'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { ArrowLeft, RefreshCw, Users, BarChart3, MessageSquare, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { FeedbackCycle, FeedbackResponse, FeedbackAnalytics } from '@/lib/feedback-types';
import { calculateFeedbackAnalytics } from '@/lib/feedback';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function FeedbackResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const firestore = useFirestore();
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const feedbackDoc = firestore ? doc(firestore, 'feedbackCycles', id) : null;
  const { data: feedback, loading: feedbackLoading } = useDoc<FeedbackCycle>(feedbackDoc as any);

  const responsesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'feedbackResponses'), where('feedbackCycleId', '==', id));
  }, [firestore, id]);

  const { data: responses, loading: responsesLoading } = useCollection<FeedbackResponse>(responsesQuery as any);

  useEffect(() => {
    if (firestore && !responsesLoading) {
      calculateFeedbackAnalytics(firestore, id).then((data) => {
        setAnalytics(data);
        setLoadingAnalytics(false);
      });
    }
  }, [firestore, id, responsesLoading]);

  if (feedbackLoading || loadingAnalytics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!feedback || !analytics) {
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
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/feedback"
            className="inline-flex items-center text-primary hover:text-primary/80 font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feedback
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-primary">{feedback.title}</h1>
              <p className="text-primary/60 mt-2">{feedback.description}</p>
            </div>
            <Badge className={cn(
              "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold uppercase",
              feedback.status === 'active' ? 'bg-green-500 text-white' :
                feedback.status === 'closed' ? 'bg-primary/20 text-primary/60' :
                  'bg-yellow-500 text-white'
            )}>
              {feedback.status}
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Responses"
            value={analytics.totalResponses}
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Questions"
            value={feedback.questions.length}
            icon={<MessageSquare className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            title="Avg Rating"
            value={
              Object.values(analytics.averageRatings).length > 0
                ? (Object.values(analytics.averageRatings).reduce((a, b) => a + b, 0) /
                  Object.values(analytics.averageRatings).length).toFixed(1)
                : 'N/A'
            }
            icon={<TrendingUp className="h-5 w-5" />}
            color="purple"
          />
          <StatCard
            title="Anonymous"
            value={feedback.anonymousResponses ? 'Yes' : 'No'}
            icon={<BarChart3 className="h-5 w-5" />}
            color="orange"
          />
        </div>

        {/* Questions and Responses */}
        <div className="space-y-6">
          {feedback.questions.map((question) => (
            <Card key={question.id} className="p-6 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-primary">{question.question}</h3>
                <Badge className="mt-2 text-xs bg-primary/10 text-primary border-none">
                  {question.type.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Rating Questions */}
              {question.type === 'rating' && analytics.averageRatings[question.id] && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary/60">Average Rating:</span>
                    <span className="text-2xl font-bold text-primary">
                      {analytics.averageRatings[question.id].toFixed(1)} / {question.ratingScale || 5}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-accent h-3 rounded-full transition-all"
                      style={{
                        width: `${(analytics.averageRatings[question.id] / (question.ratingScale || 5)) * 100}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-primary/40">
                    Based on {analytics.responsesByQuestion[question.id]?.length || 0} responses
                  </p>
                </div>
              )}

              {/* Multiple Choice Questions */}
              {question.type === 'multiple_choice' && analytics.multipleChoiceDistribution[question.id] && (
                <div className="space-y-3">
                  {Object.entries(analytics.multipleChoiceDistribution[question.id]).map(([option, count]) => (
                    <div key={option} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-primary">{option}</span>
                        <span className="font-bold text-primary">
                          {count} ({((count as number / analytics.totalResponses) * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${(count as number / analytics.totalResponses) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Text Responses */}
              {question.type === 'text' && analytics.textResponses[question.id] && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary/60 mb-3">
                    {analytics.textResponses[question.id].length} Text Responses:
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {analytics.textResponses[question.id].map((response, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-tl-lg rounded-br-lg border border-primary/10">
                        <p className="text-sm text-primary">{response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yes/No Questions */}
              {question.type === 'yes_no' && analytics.multipleChoiceDistribution[question.id] && (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(analytics.multipleChoiceDistribution[question.id]).map(([option, count]) => (
                    <div key={option} className="text-center p-4 bg-gray-50 rounded-tl-lg rounded-br-lg">
                      <p className="text-3xl font-bold text-primary">{count}</p>
                      <p className="text-sm font-medium text-primary/60 mt-1">{option}</p>
                      <p className="text-xs text-primary/40 mt-1">
                        {((count as number / analytics.totalResponses) * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Individual Responses */}
        {responses && responses.length > 0 && !feedback.anonymousResponses && (
          <Card className="mt-6 p-6 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <h2 className="text-xl font-bold text-primary mb-4">Individual Responses</h2>
            <div className="space-y-4">
              {responses.map((response) => (
                <div key={response.id} className="p-4 bg-gray-50 rounded-tl-lg rounded-br-lg border border-primary/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-primary">{response.respondentName || 'Anonymous'}</p>
                      <p className="text-xs text-primary/60">{response.respondentRole}</p>
                    </div>
                    <p className="text-xs text-primary/40">
                      {response.submittedAt.toDate().toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm text-primary/80">
                    {response.answers.length} answers submitted
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {analytics.totalResponses === 0 && (
          <Card className="p-12 text-center rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <MessageSquare className="h-16 w-16 text-primary/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-primary/40 mb-2">No Responses Yet</h3>
            <p className="text-primary/60">
              Responses will appear here once users start submitting feedback.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
  };

  return (
    <Card className="p-6 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-primary mt-2">{value}</p>
        </div>
        <div className={cn('p-3 rounded-tl-lg rounded-br-lg', colorClasses[color as keyof typeof colorClasses])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
