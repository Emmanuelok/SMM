import { failure, type PublishFailure } from '@smm/shared';

/**
 * The model, behind a seam.
 *
 * Same shape as the credential vault's `KeyProvider`, and for the same reason:
 * the thing behind it will be swapped. Model prices move by an order of
 * magnitude a year, the cheap tier is a different vendor every few months, and
 * a caption is a small enough unit of work that switching should be a
 * configuration change rather than a rewrite.
 *
 * The interface is deliberately narrow — one call, text in and text out. Every
 * feature built here (captions, variants, hashtags, replies, alt text) is that
 * one call with a different prompt, and a wider interface would invite
 * per-feature vendor coupling.
 */

export interface CompletionRequest {
  /**
   * The stable part, sent first.
   *
   * Kept separate so providers that support prompt caching can be told which
   * span to cache. The brand block is the same on every request for a brand,
   * and caching it is the difference between a caption costing a rounding
   * error and costing enough that somebody has to meter it.
   */
  readonly prefix: string;
  /** The request-specific part. Varies every call by definition. */
  readonly instruction: string;
  /** A ceiling, not a target. */
  readonly maxOutputTokens: number;
  /**
   * How many independent answers to produce.
   *
   * Requested as a batch rather than by calling n times, because the prefix is
   * charged once for a batch and once per call otherwise.
   */
  readonly variants: number;
}

export interface CompletionResult {
  readonly texts: readonly string[];
  /** What the provider says it charged, for cost reporting. Absent is fine. */
  readonly usage?:
    | { readonly inputTokens: number; readonly outputTokens: number; readonly cachedTokens?: number }
    | undefined;
}

export interface AssistantProvider {
  /** Named in logs and in the "which model wrote this" audit trail. */
  readonly name: string;
  complete(request: CompletionRequest): Promise<CompletionResult>;
}

/**
 * What the API answers with when no model is configured.
 *
 * Deliberately not an exception. The rest of this system starts and explains
 * itself rather than crashing on missing configuration, and an AI feature is
 * the *most* optional thing here — a deployment with no model key should
 * schedule and publish perfectly, and say plainly that this one panel is off.
 */
export const NOT_CONFIGURED: PublishFailure = failure(
  'unsupported_operation',
  'No writing model is configured for this deployment. Set ASSISTANT_API_KEY to turn this on.',
);

/**
 * Read a provider out of the environment, or nothing.
 *
 * Returns undefined rather than throwing for the same reason as above: the
 * absence of a key is a valid deployment, not a fault.
 */
export function providerFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): AssistantProvider | undefined {
  const key = env['ASSISTANT_API_KEY'];
  if (key === undefined || key.trim() === '') return undefined;

  return new AnthropicProvider({
    apiKey: key.trim(),
    model: env['ASSISTANT_MODEL']?.trim() || DEFAULT_MODEL,
  });
}

/**
 * The default model.
 *
 * A small, fast one on purpose. The research is unambiguous that caption
 * generation is a rounding error at this tier — thousands of captions per
 * dollar — and that any vendor metering it as a scarce resource is metering
 * nothing. Spending twenty times as much per caption buys very little on a
 * task this constrained.
 */
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

const ANTHROPIC_VERSION = '2023-06-01';

interface AnthropicOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly baseUrl?: string;
}

/**
 * Anthropic's Messages API.
 *
 * Written directly against the HTTP interface rather than through the SDK: the
 * whole surface used here is one POST with three fields, and a dependency that
 * ships its own HTTP stack and retry policy is a poor trade for that.
 */
export class AnthropicProvider implements AssistantProvider {
  readonly name: string;
  readonly #apiKey: string;
  readonly #model: string;
  readonly #baseUrl: string;

  constructor(options: AnthropicOptions) {
    this.name = `anthropic:${options.model}`;
    this.#apiKey = options.apiKey;
    this.#model = options.model;
    this.#baseUrl = options.baseUrl ?? 'https://api.anthropic.com';
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const response = await fetch(new URL('/v1/messages', this.#baseUrl), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.#apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.#model,
        max_tokens: request.maxOutputTokens,
        system: [
          {
            type: 'text',
            text: request.prefix,
            // The brand block is identical on every request for a brand. This
            // is the single line that makes the cost arithmetic work.
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: request.instruction }],
      }),
      // Without a timeout a hung connection holds a request handler open until
      // the platform kills the whole process.
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const detail = (await response.json().catch(() => ({}))) as {
        error?: { message?: string; type?: string };
      };
      throw Object.assign(new Error(detail.error?.message ?? `Model call failed (${response.status})`), {
        status: response.status,
        type: detail.error?.type,
      });
    }

    const payload = (await response.json()) as {
      content?: readonly { type: string; text?: string }[];
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        cache_read_input_tokens?: number;
      };
    };

    const text = (payload.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('')
      .trim();

    return {
      // One message, one answer. Splitting a batch out of a single response is
      // the caller's job, because how to split depends on what was asked for.
      texts: text === '' ? [] : [text],
      ...(payload.usage === undefined
        ? {}
        : {
            usage: {
              inputTokens: payload.usage.input_tokens ?? 0,
              outputTokens: payload.usage.output_tokens ?? 0,
              ...(payload.usage.cache_read_input_tokens === undefined
                ? {}
                : { cachedTokens: payload.usage.cache_read_input_tokens }),
            },
          }),
    };
  }
}
