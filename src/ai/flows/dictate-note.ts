'use server';
/**
 * @fileOverview A flow for converting dictated audio into text.
 *
 * - dictateNote - Transcribes audio data to text.
 * - DictateNoteInput - The input type for the dictateNote function.
 * - DictateNoteOutput - The return type for the dictateNote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DictateNoteInputSchema = z.object({
  audio: z.string().describe("A Base64-encoded audio chunk."),
  mimeType: z.string().describe("The MIME type of the audio. e.g., 'audio/webm'"),
});
export type DictateNoteInput = z.infer<typeof DictateNoteInputSchema>;

const DictateNoteOutputSchema = z.object({
  text: z.string().describe("The transcribed text from the audio."),
});
export type DictateNoteOutput = z.infer<typeof DictateNoteOutputSchema>;


export async function dictateNote(input: DictateNoteInput): Promise<DictateNoteOutput> {
  return dictateNoteFlow(input);
}

const dictateNoteFlow = ai.defineFlow(
  {
    name: 'dictateNoteFlow',
    inputSchema: DictateNoteInputSchema,
    outputSchema: DictateNoteOutputSchema,
  },
  async ({ audio, mimeType }) => {
    const { text } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: [
        {
          media: {
            url: `data:${mimeType};base64,${audio}`,
          },
        },
        {
          text: 'Transcribe the audio. The audio is a person dictating a note for a customer relationship management app.'
        }
      ]
    });
    return { text: text || '' };
  }
);
