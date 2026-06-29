<script lang="ts">
  import { getLevel, getLevelProgress } from '$lib/gamification/xp';
  import { t } from '$lib/i18n';
  import type { Tone } from '$lib/i18n';

  interface Props {
    totalXp: number;
    animate?: boolean;
    compact?: boolean;
    tone?: Tone;
  }

  let { totalXp, animate = true, compact = false, tone = 'neutral' }: Props = $props();

  let animating = $state(false);
  let prevXp = $state(totalXp);

  const level = $derived(getLevel(totalXp));
  const progress = $derived(getLevelProgress(totalXp));

  // Animate on XP change
  $effect(() => {
    if (totalXp !== prevXp) {
      animating = true;
      prevXp = totalXp;
      const timer = setTimeout(() => (animating = false), 600);
      return () => clearTimeout(timer);
    }
  });
</script>

<div class="w-full" class:compact>
  <div class="flex items-center justify-between mb-1">
    <span class="text-sm font-bold">
      {t('xpbar.level', tone, String(level.level), level.title)}
    </span>
    <span class="text-xs text-gray-500">{totalXp} XP</span>
  </div>
  <div class="w-full bg-base-300 rounded-full h-{compact ? '1.5' : '2.5'} overflow-hidden">
    <div
      class="bg-gradient-to-r from-red-700 to-red-500 h-full rounded-full transition-all duration-500 ease-out"
      class:animate-glow={animating}
      style="width: {progress}%"
    ></div>
  </div>
  {#if !compact}
    <div class="flex justify-between mt-0.5">
      <span class="text-xs text-gray-600">Level {level.level}</span>
      <span class="text-xs text-gray-600">{progress}% → Lv.{level.level + 1}</span>
    </div>
  {/if}
</div>
