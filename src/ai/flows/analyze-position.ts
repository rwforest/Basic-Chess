// The analyzePosition Flow provides an analysis of the current chess board position, summarizing strategic advantages and disadvantages for each side.
// - analyzePosition - Analyzes the chess position and returns a summary for each side.
// - AnalyzePositionInput - Input type for the analyzePosition function.
// - AnalyzePositionOutput - Output type for the analyzePosition function.

'use server';

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnalyzePositionInputSchema = z.object({
  fen: z.string().describe('The Forsyth-Edwards Notation (FEN) representation of the chess board position.'),
});

export type AnalyzePositionInput = z.infer<typeof AnalyzePositionInputSchema>;

const AnalyzePositionOutputSchema = z.object({
  whiteSummary: z.string().describe('A summary of the strategic advantages and disadvantages for white.'),
  blackSummary: z.string().describe('A summary of the strategic advantages and disadvantages for black.'),
});

export type AnalyzePositionOutput = z.infer<typeof AnalyzePositionOutputSchema>;

export async function analyzePosition(input: AnalyzePositionInput): Promise<AnalyzePositionOutput> {
  return analyzePositionFlow(input);
}

const analyzePositionPrompt = ai.definePrompt({
  name: 'analyzePositionPrompt',
  input: {
    schema: z.object({
      fen: z.string().describe('The Forsyth-Edwards Notation (FEN) representation of the chess board position.'),
    }),
  },
  output: {
    schema: z.object({
      whiteSummary: z.string().describe('A summary of the strategic advantages and disadvantages for white.'),
      blackSummary: z.string().describe('A summary of the strategic advantages and disadvantages for black.'),
    }),
  },
  prompt: `You are a grandmaster chess player. Analyze the chess position in the given Forsyth-Edwards Notation (FEN).

FEN: {{{fen}}}

Provide a brief summary of the strategic advantages and disadvantages for each side. Focus on key tactical and strategic elements in the position.  Return the strategic advantages and disadvantages for white in the whiteSummary field.`,
});

const analyzePositionFlow = ai.defineFlow<
  typeof AnalyzePositionInputSchema,
  typeof AnalyzePositionOutputSchema
>({
  name: 'analyzePositionFlow',
  inputSchema: AnalyzePositionInputSchema,
  outputSchema: AnalyzePositionOutputSchema,
},
async input => {
  const {output} = await analyzePositionPrompt(input);
  return {
    whiteSummary: output?.whiteSummary ?? 'No analysis available.',
    blackSummary: 'Analysis for black is not implemented yet.',
  };
});
