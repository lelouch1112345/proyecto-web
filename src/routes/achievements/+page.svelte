<script lang="ts">
  import { onMount } from 'svelte';
  import { achievementRepo } from '$lib/db';
  import type { Achievement } from '$lib/types';

  let achievements = $state<Achievement[]>([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      achievements = await achievementRepo.getAll();
    } catch (e) {
      console.error('Failed to load achievements:', e);
    } finally {
      loading = false;
    }
  });
</script>

<div class="space-y-6">
  <h1 class="text-3xl font-bold">Achievements</h1>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <span class="loading loading-spinner loading-lg text-red-500"></span>
    </div>
  {:else if achievements.length === 0}
    <div class="flex flex-col items-center justify-center h-64 text-center">
      <div class="text-6xl mb-4">&#127942;</div>
      <p class="text-gray-400 text-lg">Complete your first tasks to earn achievements!</p>
      <a href="/" class="btn btn-outline btn-error mt-4">Go to Dashboard</a>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {#each achievements as achievement}
        <div
          class="card bg-base-200 border p-4 transition-all {achievement.unlocked ? 'border-yellow-600/50 shadow-lg shadow-yellow-900/20' : 'border-red-900/20 opacity-50'}"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="text-3xl">{achievement.icon}</span>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-sm">{achievement.name}</h3>
              <p class="text-xs text-gray-500">{achievement.category}</p>
            </div>
            {#if achievement.unlocked}
              <span class="badge badge-success badge-sm">Unlocked</span>
            {:else}
              <span class="badge badge-ghost badge-sm">Locked</span>
            {/if}
          </div>
          <p class="text-xs text-gray-400">{achievement.description}</p>
          {#if !achievement.unlocked && achievement.progress !== undefined && achievement.progress > 0 && achievement.progress < 100}
            <div class="mt-2">
              <div class="w-full bg-base-300 rounded-full h-1.5">
                <div class="bg-red-500 h-1.5 rounded-full" style="width: {achievement.progress}%"></div>
              </div>
              <span class="text-xs text-gray-500 mt-0.5 block">{achievement.progress}%</span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
