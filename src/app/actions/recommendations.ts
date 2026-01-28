'use server';

import { recommendCourses } from '@/ai/flows/ai-course-recommendation';
import { z } from 'zod';

const schema = z.object({
  learnerProfile: z.string().min(50, 'Please provide a more detailed profile (at least 50 characters).'),
  learningHistory: z.string().min(50, 'Please provide more details about your learning history (at least 50 characters).'),
});

export type FormState = {
  message: string;
  recommendations?: string[];
  errors?: {
    learnerProfile?: string[];
    learningHistory?: string[];
  };
};

export async function getRecommendations(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = schema.safeParse({
    learnerProfile: formData.get('learnerProfile'),
    learningHistory: formData.get('learningHistory'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await recommendCourses(validatedFields.data);
    if (result.recommendedCourses && result.recommendedCourses.length > 0) {
      return {
        message: 'Here are your recommendations!',
        recommendations: result.recommendedCourses,
      };
    }
    return { message: "We couldn't find any recommendations based on your profile." };
  } catch (e) {
    console.error(e);
    return { message: 'An unexpected error occurred. Please try again later.' };
  }
}
