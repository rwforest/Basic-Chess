'use server';
/**
 * @fileOverview An AI agent that suggests a chess move.
 *
 * - suggestMove - A function that suggests a move.
 * - SuggestMoveInput - The input type for the suggestMove function.
 * - SuggestMoveOutput - The return type for the suggestMove function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestMoveInputSchema = z.object({
  boardState: z
    .string()
    .describe("A FEN (Forsyth–Edwards Notation) representation of the current chess board state."),
});
export type SuggestMoveInput = z.infer<typeof SuggestMoveInputSchema>;

const SuggestMoveOutputSchema = z.object({
  suggestedMove: z.string().describe('The suggested move in algebraic notation (e.g., e4, Nf3, Rd8).'),
  reasoning: z.string().describe('The AI reasoning behind the suggested move.'),
});
export type SuggestMoveOutput = z.infer<typeof SuggestMoveOutputSchema>;

export async function suggestMove(input: SuggestMoveInput): Promise<SuggestMoveOutput> {
  return suggestMoveFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMovePrompt',
  input: {
    schema: z.object({
      boardState: z
        .string()
        .describe("A FEN (Forsyth–Edwards Notation) representation of the current chess board state."),
    }),
  },
  output: {
    schema: z.object({
      suggestedMove: z.string().describe('The suggested move in algebraic notation (e.g., e4, Nf3, Rd8).'),
      reasoning: z.string().describe('The AI reasoning behind the suggested move.'),
    }),
  },
  prompt: `You are a grandmaster chess player. Given the current board state in FEN notation, suggest the best move for white.

  Explain your reasoning behind the move.  Return the move in algebraic notation.

Current board state (FEN): {{{boardState}}}
`,
});

const suggestMoveFlow = ai.defineFlow<
  typeof SuggestMoveInputSchema,
  typeof SuggestMoveOutputSchema
>({
  name: 'suggestMoveFlow',
  inputSchema: SuggestMoveInputSchema,
  outputSchema: SuggestMoveOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});

