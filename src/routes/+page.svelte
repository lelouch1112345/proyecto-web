<script lang="ts">
  import { onMount } from 'svelte';
  import { planRepo } from '$lib/db';
  import { heartRepo, streakRepo } from '$lib/db/repositories/hearts';
  import type { Day, Hearts, Streak } from '$lib/types';

  let currentDay = $state<Day | null>(null);
  let hearts = $state<Hearts | null>(null);
  let streak = $state<Streak | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  const disciplineClasses: Record<string, string> = {
    english: 'bg-blue-900/50 text-blue-300',
    music: 'bg-purple-900/50 text-purple-300',
    japanese: 'bg-red-900/50 text-red-300',
    spanish: 'bg-yellow-900/50 text-yellow-300'
  };

  const difficultyClasses: Record<string, string> = {
    easy: 'bg-green-900/50 text-green-300',
    medium: 'bg-yellow-900/50 text-yellow-300',
    hard: 'bg-red-900/50 text-red-300'
  };

  onMount(async () => {
    try {
      const plan = await planRepo.getActive();
      if (!plan) {
        error = 'Study plan not loaded. Reinstall the app.';
        return;
      }
      const dayNumber = planRepo.getCurrentDayNumber(plan);
      const day = await planRepo.getDay(plan.id, dayNumber);
      currentDay = day ?? null;
      hearts = (await heartRepo.getState()) ?? null;
      streak = (await streakRepo.getState()) ?? null;
    } catch (e) {
      console.error('Dashboard load error:', e);
      error = 'Study plan not loaded. Reinstall the app.';
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <div class="flex items-center justify-center h-64">
    <span class="loading loading-spinner loading-lg text-red-500"></span>
  </div>
{:else if error}
  <div class="flex flex-col items-center justify-center h-64 text-center">
    <div class="text-6xl mb-4">&#9888;&#65039;</div>
    <h2 class="text-2xl font-bold text-red-400 mb-2">No Plan Loaded</h2>
    <p class="text-gray-400 max-w-md">{error}</p>
  </div>
{:else if currentDay}
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">
          {currentDay.label || `Day ${currentDay.day}`}
        </h1>
        {#if currentDay.title}
          <p class="text-gray-400 mt-1">{currentDay.title}</p>
        {/if}
      </div>
      <div class="flex gap-3 items-center">
        {#if hearts}
          <div class="flex gap-0.5" title={`${hearts.current}/${hearts.max} hearts`}>
            {#each Array(hearts.max) as _, i}
              <span class="text-xl">{i < hearts.current ? '&#10084;&#65039;' : '&#128420;'}</span>
            {/each}
          </div>
        {/if}
        {#if streak}
          <div class="badge badge-outline badge-warning gap-1">
            <span class="text-lg">&#128293;</span>
            <span class="font-bold">{streak.current}</span>
          </div>
        {/if}
      </div>
    </div>

    {#if currentDay.tasks.length === 0}
      <div class="card bg-base-200 border border-red-900/20 p-8 text-center">
        <p class="text-xl text-gray-400">No tasks scheduled — enjoy your rest</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each currentDay.tasks as task, i}
          <div
            class="card bg-base-200 border p-4 transition-colors {i === 0 ? 'border-red-700/40' : 'border-red-900/20'}"
            style={i === 0 ? 'box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.3);' : ''}
          >
            <div class="flex items-start gap-3">
              <input
                type="checkbox"
                class="checkbox checkbox-error mt-1"
                disabled
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full {disciplineClasses[task.discipline] ?? 'bg-gray-900/50 text-gray-300'}">
                    {task.discipline}
                  </span>
                  <span class="text-xs px-2 py-0.5 rounded-full {difficultyClasses[task.difficulty] ?? 'bg-gray-900/50 text-gray-300'}">
                    {task.difficulty}
                  </span>
                  <span class="text-xs text-gray-500">{task.durationMin} min</span>
                </div>
                <p class="text-sm">{task.description}</p>
                {#if task.detail}
                  <p class="text-xs text-gray-500 mt-1 italic">{task.detail}</p>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <div class="card bg-base-200 border border-red-900/20 p-4">
      <div class="flex items-center gap-2 text-sm text-gray-400">
        <span>&#127919;</span>
        <span class="italic">Micro-objective: Complete the highlighted task first</span>
      </div>
    </div>
  </div>
{:else}
  <div class="flex flex-col items-center justify-center h-64 text-center">
    <div class="text-6xl mb-4">&#128203;</div>
    <h2 class="text-2xl font-bold text-gray-400 mb-2">No tasks scheduled</h2>
    <p class="text-gray-500">Enjoy your rest day!</p>
  </div>
{/if}
