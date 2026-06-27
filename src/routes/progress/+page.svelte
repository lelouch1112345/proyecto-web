<script lang="ts">
  import { onMount } from 'svelte';

  let loading = $state(true);

  onMount(async () => {
    loading = false;
  });
</script>

<div class="space-y-6">
  <h1 class="text-3xl font-bold">Progress</h1>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <span class="loading loading-spinner loading-lg text-red-500"></span>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- XP History -->
      <div class="card bg-base-200 border border-red-900/20 p-6 col-span-full md:col-span-2">
        <h2 class="text-lg font-bold mb-2">XP History</h2>
        <p class="text-gray-500 text-sm">Complete your first tasks to see progress here.</p>
      </div>

      <!-- Discipline Radar -->
      <div class="card bg-base-200 border border-red-900/20 p-6">
        <h2 class="text-lg font-bold mb-2">Disciplines</h2>
        <p class="text-gray-500 text-sm">Complete your first tasks to see progress here.</p>
      </div>

      <!-- Streak Calendar -->
      <div class="card bg-base-200 border border-red-900/20 p-6">
        <h2 class="text-lg font-bold mb-2">Streak Calendar</h2>
        <p class="text-gray-500 text-sm">Complete your first tasks to see progress here.</p>
      </div>

      <!-- Calibration Accuracy -->
      <div class="card bg-base-200 border border-red-900/20 p-6 col-span-full md:col-span-2">
        <h2 class="text-lg font-bold mb-2">Calibration Accuracy</h2>
        <p class="text-gray-500 text-sm">Complete your first tasks to see progress here.</p>
      </div>
    </div>

    <div class="text-center mt-8">
      <a href="/" class="btn btn-outline btn-error">Go to Dashboard</a>
    </div>
  {/if}
</div>
