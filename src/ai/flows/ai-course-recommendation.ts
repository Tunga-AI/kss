'use server';
/**
 * @fileOverview This file defines a Genkit flow for recommending courses to learners.
 *
 * - recommendCourses - A function that takes a learner profile and learning history as input and returns a list of recommended courses.
 * - RecommendCoursesInput - The input type for the recommendCourses function.
 * - RecommendCoursesOutput - The return type for the recommendCourses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendCoursesInputSchema = z.object({
  learnerProfile: z
    .string()
    .describe('A description of the learner, their background, and interests.'),
  learningHistory: z
    .string()
    .describe('A summary of the learner\'s past courses and performance.'),
});
export type RecommendCoursesInput = z.infer<typeof RecommendCoursesInputSchema>;

const RecommendCoursesOutputSchema = z.object({
  recommendedCourses: z
    .array(z.string())
    .describe('A list of course titles recommended to the learner.'),
});
export type RecommendCoursesOutput = z.infer<typeof RecommendCoursesOutputSchema>;

export async function recommendCourses(input: RecommendCoursesInput): Promise<RecommendCoursesOutput> {
  return recommendCoursesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendCoursesPrompt',
  input: {schema: RecommendCoursesInputSchema},
  output: {schema: RecommendCoursesOutputSchema},
  prompt: `You are an AI course recommendation system for KSS, a sales training institute. Based on the learner's profile and learning history, recommend a list of courses that would be interesting and beneficial to them. Only suggest courses that are related to sales training. Return the course titles.

Learner Profile: {{{learnerProfile}}}
Learning History: {{{learningHistory}}}

Recommended Courses:`,
});

const recommendCoursesFlow = ai.defineFlow(
  {
    name: 'recommendCoursesFlow',
    inputSchema: RecommendCoursesInputSchema,
    outputSchema: RecommendCoursesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
