'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { addFeedbackCycle, updateFeedbackCycle, getFeedbackCyclesForUser } from '@/lib/feedback';
import type { FeedbackCycle, FeedbackQuestion, FeedbackType, QuestionType, FeedbackStatus } from '@/lib/feedback-types';
import { notifyFeedbackCycle } from '@/lib/notifications';
import type { User } from '@/lib/user-types';
import { Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface FeedbackFormProps {
  feedback?: FeedbackCycle;
}

export function FeedbackForm({ feedback }: FeedbackFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const [title, setTitle] = useState(feedback?.title || '');
  const [description, setDescription] = useState(feedback?.description || '');
  const [type, setType] = useState<FeedbackType>(feedback?.type || 'general');
  const [status, setStatus] = useState<FeedbackStatus>(feedback?.status || 'draft');
  const [targetAudience, setTargetAudience] = useState(feedback?.targetAudience || 'all');
  const [anonymousResponses, setAnonymousResponses] = useState(feedback?.anonymousResponses || false);
  const [startDate, setStartDate] = useState(
    feedback?.startDate ? new Date(feedback.startDate.toMillis()).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    feedback?.endDate ? new Date(feedback.endDate.toMillis()).toISOString().split('T')[0] : ''
  );
  const [questions, setQuestions] = useState<FeedbackQuestion[]>(feedback?.questions || []);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: uuidv4(),
        question: '',
        type: 'text',
        required: false,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<FeedbackQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    setSaving(true);
    try {
      const cycleData = {
        title,
        description,
        type,
        status,
        targetAudience,
        anonymousResponses,
        questions,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        createdBy: user.id,
        updatedAt: Timestamp.now(),
      };

      let cycleId: string;

      if (feedback) {
        await updateFeedbackCycle(firestore, feedback.id, cycleData);
        cycleId = feedback.id;
      } else {
        const docRef = await addFeedbackCycle(firestore, {
          ...cycleData,
          createdAt: Timestamp.now(),
        } as Omit<FeedbackCycle, 'id'>);
        cycleId = docRef.id;
      }

      // Send notifications if status is 'active' and it's a new feedback or status changed to active
      if (status === 'active' && (!feedback || feedback.status !== 'active')) {
        // Get target user IDs based on target audience
        let targetUserIds: string[] = [];

        if (targetAudience === 'all') {
          const usersQuery = query(collection(firestore, 'users'));
          const usersSnapshot = await getDocs(usersQuery);
          targetUserIds = usersSnapshot.docs.map(doc => doc.id);
        } else if (targetAudience === 'learners') {
          const learnersQuery = query(
            collection(firestore, 'users'),
            where('role', '==', 'Learner')
          );
          const learnersSnapshot = await getDocs(learnersQuery);
          targetUserIds = learnersSnapshot.docs.map(doc => doc.id);
        } else if (targetAudience === 'instructors') {
          const instructorsQuery = query(
            collection(firestore, 'users'),
            where('role', '==', 'Facilitator')
          );
          const instructorsSnapshot = await getDocs(instructorsQuery);
          targetUserIds = instructorsSnapshot.docs.map(doc => doc.id);
        }

        // Send notifications to target users
        if (targetUserIds.length > 0) {
          await notifyFeedbackCycle(
            firestore,
            cycleId,
            title,
            description,
            targetUserIds,
            user.id
          );
        }
      }

      router.push('/admin/feedback');
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Error saving feedback cycle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
        <h2 className="text-xl font-bold text-primary mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-bold text-primary/60 uppercase">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-2 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
              placeholder="e.g., End of Term Feedback"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-bold text-primary/60 uppercase">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-2 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
              rows={3}
              placeholder="Describe the purpose of this feedback cycle..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type" className="text-sm font-bold text-primary/60 uppercase">Feedback Type *</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as FeedbackType)}
                className="w-full mt-2 px-4 py-2 border border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:outline-none focus:ring-2 focus:ring-primary/10"
                required
              >
                <option value="general">General</option>
                <option value="class">Class</option>
                <option value="instructor">Instructor</option>
                <option value="program">Program</option>
                <option value="cohort">Cohort</option>
              </select>
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-bold text-primary/60 uppercase">Status *</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
                className="w-full mt-2 px-4 py-2 border border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:outline-none focus:ring-2 focus:ring-primary/10"
                required
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-sm font-bold text-primary/60 uppercase">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="mt-2 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="text-sm font-bold text-primary/60 uppercase">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="mt-2 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="targetAudience" className="text-sm font-bold text-primary/60 uppercase">Target Audience *</Label>
            <select
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full mt-2 px-4 py-2 border border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:outline-none focus:ring-2 focus:ring-primary/10"
              required
            >
              <option value="all">All Users</option>
              <option value="learners">Learners Only</option>
              <option value="instructors">Instructors Only</option>
              <option value="specific">Specific Users</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={anonymousResponses}
              onChange={(e) => setAnonymousResponses(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="anonymous" className="text-sm font-medium text-primary cursor-pointer">
              Allow anonymous responses
            </Label>
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">Questions</h2>
          <Button
            type="button"
            onClick={addQuestion}
            className="bg-accent hover:bg-accent/90 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="p-4 bg-gray-50 border-primary/10">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <Label className="text-sm font-bold text-primary/60 uppercase">Question {index + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Input
                  value={question.question}
                  onChange={(e) => updateQuestion(index, { question: e.target.value })}
                  placeholder="Enter your question..."
                  className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-primary/60 uppercase">Question Type</Label>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(index, { type: e.target.value as QuestionType })}
                      className="w-full mt-1 px-3 py-2 border border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none text-sm"
                    >
                      <option value="text">Text Response</option>
                      <option value="rating">Rating Scale</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="yes_no">Yes/No</option>
                    </select>
                  </div>

                  {question.type === 'rating' && (
                    <div>
                      <Label className="text-xs font-bold text-primary/60 uppercase">Rating Scale</Label>
                      <Input
                        type="number"
                        min="3"
                        max="10"
                        value={question.ratingScale || 5}
                        onChange={(e) => updateQuestion(index, { ratingScale: parseInt(e.target.value) })}
                        className="mt-1 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                      />
                    </div>
                  )}
                </div>

                {question.type === 'multiple_choice' && (
                  <div>
                    <Label className="text-xs font-bold text-primary/60 uppercase">Options (comma-separated)</Label>
                    <Input
                      value={question.options?.join(', ') || ''}
                      onChange={(e) => updateQuestion(index, { options: e.target.value.split(',').map(o => o.trim()) })}
                      placeholder="Option 1, Option 2, Option 3"
                      className="mt-1 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                    className="rounded"
                  />
                  <Label className="text-xs font-medium text-primary cursor-pointer">
                    Required question
                  </Label>
                </div>
              </div>
            </Card>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-10 text-primary/40">
              <p className="font-medium">No questions added yet</p>
              <p className="text-sm">Click "Add Question" to get started</p>
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/feedback')}
          className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving || questions.length === 0}
          className="bg-primary hover:bg-primary/90 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : feedback ? 'Update Feedback' : 'Create Feedback'}
        </Button>
      </div>
    </form>
  );
}
