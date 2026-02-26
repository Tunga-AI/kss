'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// ─── Input / Output schemas ────────────────────────────────────────────────

const CompetencyResultSchema = z.object({
    competencyId: z.string(),
    competencyName: z.string(),
    categoryName: z.string(),
    categoryDescription: z.string(),
    questionsAttempted: z.number(),
    questionsCorrect: z.number(),
    earnedPoints: z.number(),
    totalPoints: z.number(),
    scorePercent: z.number().describe('0–100'),
    scoreOutOf10: z.number().describe('0–10, derived from scorePercent'),
});

const AssessmentReportInputSchema = z.object({
    learnerName: z.string(),
    assessmentTitle: z.string(),
    assessmentDescription: z.string(),
    overallScore: z.number().describe('Percentage 0–100'),
    passed: z.boolean(),
    passingScore: z.number(),
    competencyResults: z.array(CompetencyResultSchema),
    completedAt: z.string().describe('Human-readable date the test was completed'),
});

export type AssessmentReportInput = z.infer<typeof AssessmentReportInputSchema>;

const CompetencyNarrativeSchema = z.object({
    competencyName: z.string(),
    scoreLabel: z.enum(['Very Low', 'Low', 'Below Average', 'Average', 'Above Average', 'High', 'Very High']),
    personalizedComment: z.string().describe('2-3 sentence narrative about the learner\'s performance on this competency, written in third person using the learner\'s name.'),
    developmentTip: z.string().describe('1-2 sentence actionable coaching tip specific to improving this competency.'),
    definition: z.string().describe('Brief 2-sentence definition of what this competency measures.'),
});

const AssessmentReportOutputSchema = z.object({
    overallScoreLabel: z.enum(['Very Low', 'Low', 'Below Average', 'Average', 'Above Average', 'High', 'Very High']),
    overallNarrative: z.string().describe('2-3 paragraph executive summary about the learner\'s overall performance, written in third person. Reference the learner by name. Cover strengths, areas for development, and a forward-looking statement.'),
    assessmentDescription: z.string().describe('1-2 paragraph description of what this assessment measures and why these competencies matter professionally.'),
    competencyNarratives: z.array(CompetencyNarrativeSchema),
    overallRecommendation: z.string().describe('One concise paragraph with an overall coaching recommendation and next steps for the learner.'),
});

export type AssessmentReportOutput = z.infer<typeof AssessmentReportOutputSchema>;

// ─── Prompt ────────────────────────────────────────────────────────────────

const reportPrompt = ai.definePrompt({
    name: 'assessmentReportPrompt',
    input: { schema: AssessmentReportInputSchema },
    output: { schema: AssessmentReportOutputSchema },
    prompt: `You are an expert psychometric assessment analyst writing a professional, personalised competency report, similar in style to Central Test or SHL reports.

LEARNER: {{learnerName}}
ASSESSMENT: {{assessmentTitle}}
DESCRIPTION: {{assessmentDescription}}
OVERALL SCORE: {{overallScore}}% (passing threshold: {{passingScore}}%)
RESULT: {{#if passed}}PASSED{{else}}DID NOT PASS{{/if}}
DATE TAKEN: {{completedAt}}

COMPETENCY SCORES:
{{#each competencyResults}}
- {{competencyName}} ({{categoryName}}): {{scoreOutOf10}}/10 ({{scorePercent}}% correct — {{questionsCorrect}}/{{questionsAttempted}} questions, {{earnedPoints}}/{{totalPoints}} points)
{{/each}}

INSTRUCTIONS:
1. Write a professional, empathetic, and constructive report in the style of a premium psychometric assessment product.
2. Use the learner's name ({{learnerName}}) throughout — write in THIRD PERSON (e.g., "{{learnerName}}'s score indicates...").
3. The scoreLabel must reflect the score out of 10: 0-1=Very Low, 1-3=Low, 3-4=Below Average, 4-6=Average, 6-7=Above Average, 7-9=High, 9-10=Very High.
4. Each personalizedComment should reference actual performance data (score, correct answers) and what it means practically.
5. Each developmentTip must be concrete and actionable — e.g., specific exercises, activities, or practices.
6. Each definition must explain the competency in a professional, accessible way.
7. Keep the overall tone positive, professional, and growth-oriented.
8. The overallNarrative should synthesize performance across all competencies — highlight top strengths and priority development areas.
9. The assessmentDescription should explain what these competencies collectively measure and why they matter in a professional context.`,
});

// ─── Flow ──────────────────────────────────────────────────────────────────

const assessmentReportFlow = ai.defineFlow(
    {
        name: 'assessmentReportFlow',
        inputSchema: AssessmentReportInputSchema,
        outputSchema: AssessmentReportOutputSchema,
    },
    async (input) => {
        const { output } = await reportPrompt(input);
        return output!;
    }
);

export async function generateAssessmentReport(input: AssessmentReportInput): Promise<AssessmentReportOutput> {
    return assessmentReportFlow(input);
}
