<script lang="ts">
  import { onMount } from 'svelte';
  import { settingsRepo } from '$lib/db';
  import type { Settings } from '$lib/types';

  let settings = $state<Settings | null>(null);
  let loading = $state(true);
  let exportedData = $state<string | null>(null);

  onMount(async () => {
    try {
      settings = (await settingsRepo.get()) ?? null;
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      loading = false;
    }
  });

  async function handleExport() {
    const data = await settingsRepo.exportAll();
    exportedData = JSON.stringify(data, null, 2);
  }

  function handleDownload() {
    if (!exportedData) return;
    const blob = new Blob([exportedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `third-life-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="space-y-6 max-w-lg">
  <h1 class="text-3xl font-bold">Settings</h1>

  {#if loading}
    <div class="flex items-center justify-center h-32">
      <span class="loading loading-spinner loading-md text-red-500"></span>
    </div>
  {:else}
    <!-- Plan Info -->
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <h2 class="text-lg font-bold mb-2">Plan Info</h2>
      <p class="text-sm text-gray-400">Third-Life v0.1.0 — 84-day gamified study plan</p>
      <p class="text-xs text-gray-500 mt-1">Data stored locally in your browser (IndexedDB)</p>
    </div>

    <!-- Session Timer -->
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <h2 class="text-lg font-bold mb-2">Session Timer</h2>
      <p class="text-sm text-gray-400 mb-2">Default session duration:</p>
      <div class="flex gap-2">
        {#each [25, 40, 60, 90] as duration}
          <button
            class="btn btn-sm {settings?.sessionTimerDefault === duration ? 'btn-error' : 'btn-ghost'}"
            onclick={async () => {
              if (settings) {
                settings = await settingsRepo.update({ sessionTimerDefault: duration });
              }
            }}
          >
            {duration} min
          </button>
        {/each}
      </div>
    </div>

    <!-- Data Export -->
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <h2 class="text-lg font-bold mb-2">Data</h2>
      <p class="text-sm text-gray-400 mb-3">Export all your data as JSON for backup:</p>
      <button class="btn btn-outline btn-error btn-sm" onclick={handleExport}>
        Preview Export
      </button>

      {#if exportedData}
        <div class="mt-3">
          <button class="btn btn-error btn-sm mb-2" onclick={handleDownload}>
            Download JSON
          </button>
          <details class="text-xs">
            <summary class="cursor-pointer text-gray-400 hover:text-gray-300">Preview</summary>
            <pre class="mt-2 bg-base-300 p-2 rounded overflow-auto max-h-40 text-gray-400">{exportedData.slice(0, 500)}...</pre>
          </details>
        </div>
      {/if}
    </div>

    <!-- About -->
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <h2 class="text-lg font-bold mb-2">About</h2>
      <p class="text-sm text-gray-400">
        Third-Life — A gamified anti-procrastination PWA for the 84-day study plan.
      </p>
      <p class="text-xs text-gray-500 mt-1">
        Built with SvelteKit 5, Dexie.js, Chart.js, daisyUI &hearts;
      </p>
    </div>
  {/if}
</div>
