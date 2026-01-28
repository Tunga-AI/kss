import { getRecommendations } from '@/app/actions/recommendations';
import { RecommendationForm } from '@/components/ai/recommendation-form';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RecommendationsPage() {
  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">AI Course Recommendations</CardTitle>
          <CardDescription>
            Tell us about your background and what you've learned so far. Our AI will suggest the next best courses for your career growth.
          </CardDescription>
        </CardHeader>
      </Card>
      <RecommendationForm action={getRecommendations} />
    </div>
  );
}
