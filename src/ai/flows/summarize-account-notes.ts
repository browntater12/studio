'use server';

/**
 * @fileOverview Summarizes notes related to a specific account using AI.
 *
 * - summarizeAccountNotes - A function that summarizes account notes.
 * - SummarizeAccountNotesInput - The input type for the summarizeAccountNotes function.
 * - SummarizeAccountNotesOutput - The return type for the summarizeAccountNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAccountNotesInputSchema = z.object({
  accountName: z.string().describe('The name of the account.'),
  notes: z.string().describe('The notes related to the account.'),
});
export type SummarizeAccountNotesInput = z.infer<typeof SummarizeAccountNotesInputSchema>;

const SummarizeAccountNotesOutputSchema = z.object({
  summary: z.string().describe('The summary of the account notes.'),
});
export type SummarizeAccountNotesOutput = z.infer<typeof SummarizeAccountNotesOutputSchema>;

export async function summarizeAccountNotes(input: SummarizeAccountNotesInput): Promise<SummarizeAccountNotesOutput> {
  return summarizeAccountNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAccountNotesPrompt',
  input: {schema: SummarizeAccountNotesInputSchema},
  output: {schema: SummarizeAccountNotesOutputSchema},
  prompt: `You are a sales expert summarizing notes for sales managers.

  Summarize the key discussion points and action items from the following notes for account "{{{accountName}}}":

  Notes: {{{notes}}}
  `,
});

const summarizeAccountNotesFlow = ai.defineFlow(
  {
    name: 'summarizeAccountNotesFlow',
    inputSchema: SummarizeAccountNotesInputSchema,
    outputSchema: SummarizeAccountNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
