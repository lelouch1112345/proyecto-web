<script lang="ts">
  import { MAX_HEARTS } from '$lib/constants';
  import { t } from '$lib/i18n';
  import type { Tone } from '$lib/i18n';

  interface Props {
    current: number;
    max?: number;
    breakMode?: boolean;
    tone?: Tone;
  }

  let { current, max = MAX_HEARTS, breakMode = false, tone = 'neutral' }: Props = $props();

  let previousHearts = $state(current);
  let animIndex = $state<number | null>(null);
  let animType = $state<'none' | 'increase' | 'decrease'>('none');

  $effect(() => {
    if (current !== previousHearts) {
      const change = current > previousHearts ? 'increase' : 'decrease';
      animType = change;
      if (change === 'increase') {
        animIndex = current - 1; // Last filled heart
      } else {
        animIndex = previousHearts - 1; // Last heart that was full
      }
      previousHearts = current;
      const timer = setTimeout(() => {
        animType = 'none';
        animIndex = null;
      }, 400);
      return () => clearTimeout(timer);
    }
  });
</script>

<div class="flex items-center gap-0.5" title={t('hearts.tooltip', tone, String(current), String(max))}>
  {#each Array(max) as _, i}
    {#if i < current}
      <span
        class="text-lg transition-all duration-300 {breakMode ? 'opacity-50' : ''}"
        class:animate-pop-in={animType === 'increase' && i === animIndex}
        class:animate-shake={animType === 'decrease' && i === animIndex}
      >❤️</span>
    {:else}
      <span class="text-lg opacity-30">🖤</span>
    {/if}
  {/each}
</div>
