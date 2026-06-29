<script lang="ts">
  import { t } from '$lib/i18n';
  import type { Tone } from '$lib/i18n';

  interface Props {
    current: number;
    longest?: number;
    freezeAvailable?: number;
    tone?: Tone;
  }

  let { current, longest, freezeAvailable, tone = 'neutral' }: Props = $props();

  let prev = $state(current);
  let fireTrigger = $state(false);
  let glowTrigger = $state(false);

  const MILESTONES = [7, 14, 30, 84];

  const streakLevel = $derived(
    current >= 84 ? 'legendary' : current >= 30 ? 'epic' : current >= 14 ? 'great' : current >= 7 ? 'good' : 'start'
  );

  const levelColors: Record<string, string> = {
    start: 'text-gray-400',
    good: 'text-orange-400',
    great: 'text-orange-500',
    epic: 'text-yellow-500',
    legendary: 'text-red-500 animate-pulse'
  };

  $effect(() => {
    if (current > prev) {
      fireTrigger = true;
      const isMilestone = MILESTONES.includes(current);
      if (isMilestone) {
        setTimeout(() => {
          glowTrigger = true;
          setTimeout(() => { glowTrigger = false; }, 1000);
        }, 500);
      }
      setTimeout(() => { fireTrigger = false; }, 500);
    }
    prev = current;
  });
</script>

<div class="flex items-center gap-1.5" class:streak-celebration={glowTrigger}>
  <span class="text-lg" title={t('streak.tooltip', tone, String(current))}>
    {#if current >= 30}
      🔥🔥
    {:else if current >= 14}
      🔥
    {:else if current >= 7}
      🔥
    {:else}
      🔥
    {/if}
  </span>
  <span
    class="font-bold text-lg {levelColors[streakLevel]}"
    class:animate-fire-grow={fireTrigger}
    class:animate-glow={glowTrigger}
  >{current}</span>
  <span class="text-xs text-gray-500">day{current !== 1 ? 's' : ''}</span>
  {#if freezeAvailable !== undefined && freezeAvailable > 0}
    <span class="text-xs text-blue-400 ml-1" title="Freezes available">
      ❄️ {freezeAvailable}
    </span>
  {/if}
</div>

<style>
  .streak-celebration {
    animation: glow-pulse 1.5s ease-out;
    border-radius: 0.5rem;
    padding: 0.125rem 0.375rem;
    margin: -0.125rem -0.375rem;
  }
</style>
