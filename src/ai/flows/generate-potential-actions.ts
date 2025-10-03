'use server';

/**
 * @fileOverview Generates potential actions for a sales representative based on account data and product notes.
 *
 * - generatePotentialActions - A function that generates potential actions based on the provided input.
 * - GeneratePotentialActionsInput - The input type for the generatePotentialActions function.
 * - GeneratePotentialActionsOutput - The output type for the generatePotentialActions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePotentialActionsInputSchema = z.object({
  accountName: z.string().describe('The name of the account.'),
  accountDetails: z.string().describe('Details about the account.'),
  productNotes: z.string().describe('Notes related to specific products for the account.'),
});
export type GeneratePotentialActionsInput = z.infer<typeof GeneratePotentialActionsInputSchema>;

const GeneratePotentialActionsOutputSchema = z.object({
  potentialActions: z.array(z.string()).describe('A list of potential actions for the sales representative.'),
});
export type GeneratePotentialActionsOutput = z.infer<typeof GeneratePotentialActionsOutputSchema>;

export async function generatePotentialActions(input: GeneratePotentialActionsInput): Promise<GeneratePotentialActionsOutput> {
  return generatePotentialActionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePotentialActionsPrompt',
  input: {schema: GeneratePotentialActionsInputSchema},
  output: {schema: GeneratePotentialActionsOutputSchema},
  prompt: `You are a sales strategy AI assistant. Based on the account data and product notes, suggest potential actions for the sales representative to take.

Account Name: {{{accountName}}}
Account Details: {{{accountDetails}}}
Product Notes: {{{productNotes}}}

Suggest 3-5 potential actions that the sales representative can take to better manage the account and identify opportunities for sales growth. Return as a numbered list.

For example:
1. Schedule a follow-up call to discuss recent product updates.
2. Identify new opportunities to introduce additional products to the account.
3. Review account needs and tailor product recommendations to meet their goals.
`,
});

const generatePotentialActionsFlow = ai.defineFlow(
  {
    name: 'generatePotentialActionsFlow',
    inputSchema: GeneratePotentialActionsInputSchema,
    outputSchema: GeneratePotentialActionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
