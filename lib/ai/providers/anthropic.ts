import Anthropic from '@anthropic-ai/sdk';
import type { Tool, ToolUseBlock } from '@anthropic-ai/sdk/resources/messages';
import {
  ArticleSchema,
  articleToolInputSchema,
  articleToolName,
  type ArticleInput,
  type ArticleStreamEvent,
} from '../schema';
import { SYSTEM_PROMPT, buildUserPrompt, RANDOM_TITLE_PROMPT } from '../prompt';
import { recordAnthropicUsage } from '../budget';

export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const MAX_OUTPUT_TOKENS = 4096;

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set.');
  _client = new Anthropic({ apiKey });
  return _client;
}

export async function* generateArticleAnthropic(
  input: ArticleInput,
): AsyncIterable<ArticleStreamEvent> {
  yield { type: 'status', message: 'Consulting the Atlas archives…' };

  const stream = client().messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: articleToolName,
        description: 'Write a fictional encyclopedia entry as a structured object.',
        input_schema: articleToolInputSchema as unknown as Tool['input_schema'],
      },
    ],
    tool_choice: { type: 'tool', name: articleToolName },
    messages: [{ role: 'user', content: buildUserPrompt(input) }],
  });

  let accumulated = '';
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'input_json_delta' &&
      typeof event.delta.partial_json === 'string'
    ) {
      accumulated += event.delta.partial_json;
      // Don't spam every token — emit partials sparingly so SSE has breathing room.
      if (accumulated.length % 200 < 20) {
        yield { type: 'partial', rawJson: accumulated };
      }
    }
  }

  const final = await stream.finalMessage();
  const toolUse = final.content.find(
    (block): block is ToolUseBlock => block.type === 'tool_use',
  );
  if (!toolUse) {
    yield {
      type: 'error',
      message: 'Model did not return a tool call.',
      recoverable: true,
    };
    return;
  }

  const parsed = ArticleSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    yield {
      type: 'error',
      message: `Article failed validation: ${parsed.error.issues[0]?.message ?? 'unknown error'}`,
      recoverable: true,
    };
    return;
  }

  const usage = {
    inputTokens: final.usage.input_tokens,
    outputTokens: final.usage.output_tokens,
  };
  await recordAnthropicUsage(usage).catch(() => {
    /* budget tracking is best-effort */
  });

  yield { type: 'done', article: parsed.data, usage };
}

export async function generateRandomTitleAnthropic(): Promise<string> {
  const result = await client().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 80,
    system: RANDOM_TITLE_PROMPT,
    messages: [{ role: 'user', content: 'Invent one entry title.' }],
  });
  const block = result.content.find((b) => b.type === 'text');
  return block?.type === 'text' ? block.text.trim().replace(/^["“]|["”]$/g, '') : 'Untitled Plate';
}
