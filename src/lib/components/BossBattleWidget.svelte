<script lang="ts">
  import type { BossBattle } from '$lib/types';
  import { t } from '$lib/i18n';
  import type { Tone } from '$lib/i18n';

  interface Props {
    battle: BossBattle | null;
    onStart?: () => void;
    tone?: Tone;
  }

  let { battle, onStart, tone = 'neutral' }: Props = $props();

  let showResult = $state(false);
  let prevCompleted = $state<boolean | undefined>(undefined);

  $effect(() => {
    if (battle) {
      if (prevCompleted !== undefined && battle.completed !== prevCompleted && battle.completed) {
        showResult = true;
        setTimeout(() => { showResult = false; }, 400);
      }
      prevCompleted = battle.completed;
    } else {
      prevCompleted = undefined;
    }
  });
</script>

<div class="card bg-base-200 border border-red-900/20 p-4">
  <div class="flex items-center justify-between mb-2">
    <h3 class="font-bold text-sm flex items-center gap-2">
      <span>⚔️</span>
      <span>Weekly Boss Battle</span>
    </h3>
    {#if battle?.completed}
      <span class="badge badge-success badge-sm" class:animate-pop-in={showResult}>Won</span>
    {:else if battle && !battle.completed}
      <span class="badge badge-warning badge-sm" class:animate-pop-in={showResult}>Lost</span>
    {:else}
      <span class="badge badge-ghost badge-sm">Ready</span>
    {/if}
  </div>

  {#if battle}
    <div class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-400">Week {battle.week}</span>
        <span>
          {battle.tasksCompleted}/{battle.totalTasks} tasks
        </span>
      </div>
      <div class="w-full bg-base-300 rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all {battle.completed ? 'bg-green-600' : 'bg-red-600'}"
          style="width: {battle.totalTasks > 0 ? (battle.tasksCompleted / battle.totalTasks) * 100 : 0}%"
        ></div>
      </div>
      <div class="flex justify-between text-xs">
        <span class="text-gray-500">
          {battle.completed ? t('boss.passed', tone) : battle.tasksCompleted > 0 ? t('boss.keep_going', tone) : t('boss.waiting', tone)}
        </span>
        <span class="text-gold-400">{battle.xpMultiplier}× XP</span>
      </div>
      {#if battle.bonusXpAwarded > 0}
        <div class="text-xs text-green-400 mt-1">
          +{battle.bonusXpAwarded} bonus XP awarded!
        </div>
      {/if}
    </div>
  {:else}
    <p class="text-xs text-gray-500 mb-2">
      Complete all tasks this week to win the boss battle and earn a 1.5× XP multiplier!
    </p>
    {#if onStart}
      <button class="btn btn-error btn-xs w-full" onclick={onStart}>
        Start Boss Battle Review
      </button>
    {/if}
  {/if}
</div>
