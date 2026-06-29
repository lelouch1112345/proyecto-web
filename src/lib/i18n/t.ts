// ────────────────────────────────────────────────────────────────
// Adaptive Tone System — Message Resolver
// Pure function: no side effects, no Svelte imports
// ────────────────────────────────────────────────────────────────

import { messages, type MessageKey } from './tone-registry';
import type { Tone } from './tone';

/**
 * Resolve a message key to its tone-variant string.
 *
 * @param key    The message key (must exist in tone-registry)
 * @param tone   Desired tone variant (defaults to 'neutral')
 * @param args   Positional args for {0}, {1}, etc. interpolation
 * @returns      The interpolated string, or the key itself as fallback
 */
export function t(
  key: MessageKey,
  tone: Tone = 'neutral',
  ...args: string[]
): string {
  const variant = messages[key]?.[tone] ?? messages[key]?.neutral ?? key;
  return variant.replace(/\{(\d+)\}/g, (_, i) => args[Number(i)] ?? '');
}
