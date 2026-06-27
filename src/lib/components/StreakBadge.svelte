<script lang="ts">
  interface Props {
    current: number;
    longest?: number;
    freezeAvailable?: number;
  }

  let { current, longest, freezeAvailable }: Props = $props();

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
</script>

<div class="flex items-center gap-1.5">
  <span class="text-lg" title="Streak: {current} days">
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
  <span class="font-bold text-lg {levelColors[streakLevel]}">{current}</span>
  <span class="text-xs text-gray-500">day{current !== 1 ? 's' : ''}</span>
  {#if freezeAvailable !== undefined && freezeAvailable > 0}
    <span class="text-xs text-blue-400 ml-1" title="Freezes available">
      ❄️ {freezeAvailable}
    </span>
  {/if}
</div>
