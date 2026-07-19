import "server-only";
import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export const AI_MODEL = client ? MODEL : "mock";
export const isAIConfigured = Boolean(client);

/**
 * Calls OpenAI in JSON mode and parses the result. When no OPENAI_API_KEY is
 * configured, runs `mock()` instead — mock implementations compute a real
 * (if simplistic) answer from the actual input data rather than returning
 * static placeholder text, so the feature is fully testable and still useful
 * without an API key.
 */
export async function generateStructured<T>(input: {
  system: string;
  user: string;
  mock: () => T;
}): Promise<{ result: T; model: string; tokensUsed: number | null }> {
  if (!client) {
    return { result: input.mock(), model: "mock", tokensUsed: null };
  }

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response.");

  return {
    result: JSON.parse(content) as T,
    model: MODEL,
    tokensUsed: completion.usage?.total_tokens ?? null,
  };
}
