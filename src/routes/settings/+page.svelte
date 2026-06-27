<script lang="ts">
  import { onMount } from 'svelte';
  import { settingsRepo, db } from '$lib/db';
  import type { Settings } from '$lib/types';

  let settings = $state<Settings | null>(null);
  let loading = $state(true);
  let exportedData = $state<string | null>(null);
  let importFile = $state<File | null>(null);
  let importStatus = $state<{ ok: boolean; message: string } | null>(null);
  let showDangerZone = $state(false);
  let resetConfirm = $state(false);
  let resetDone = $state(false);

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

  async function handleImport() {
    if (!importFile) {
      importStatus = { ok: false, message: 'Please select a file first.' };
      return;
    }
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object') {
        importStatus = { ok: false, message: 'Invalid backup file format.' };
        return;
      }
      await settingsRepo.importAll(data);
      importStatus = { ok: true, message: 'Data imported successfully! Reloading...' };
      // Reload after successful import
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error('Import failed:', e);
      importStatus = { ok: false, message: `Import failed: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
  }

  async function handleThemeToggle() {
    if (!settings) return;
    const newTheme = settings.theme === 'dark' ? 'red-dark' : 'dark';
    settings = await settingsRepo.update({ theme: newTheme });
    // Update the data-theme attribute on the html element for daisyUI
    document.documentElement.setAttribute('data-theme', settings.theme);
  }

  async function handleResetAll() {
    if (!resetConfirm) {
      resetConfirm = true;
      return;
    }
    try {
      // Clear all IndexedDB tables
      await db.plans.clear();
      await db.days.clear();
      await db.taskResults.clear();
      await db.checkIns.clear();
      await db.xpEvents.clear();
      await db.achievements.clear();
      await db.hearts.clear();
      await db.errorLogs.clear();
      await db.calibration.clear();
      await db.streak.clear();
      await db.settings.clear();
      resetDone = true;
      // Reload to re-seed
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      console.error('Reset failed:', e);
    }
  }
</script>

<div class="space-y-6 max-w-lg">
  <h1 class="text-3xl font-bold">Settings</h1>

  {#if loading}
    <div class="flex items-center justify-center h-32">
      <span class="loading loading-spinner loading-md text-red-500"></span>
    </div>
  {:else}
    <!-- Theme -->
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <h2 class="text-lg font-bold mb-2">Theme</h2>
      <p class="text-sm text-gray-400 mb-3">Toggle between dark color schemes:</p>
      <div class="flex gap-2">
        <button
          class="btn btn-sm {settings?.theme === 'dark' ? 'btn-error' : 'btn-ghost'}"
          onclick={async () => {
            settings = await settingsRepo.update({ theme: 'dark' });
            document.documentElement.setAttribute('data-theme', settings.theme);
          }}
        >
          Dark
        </button>
        <button
          class="btn btn-sm {settings?.theme === 'red-dark' ? 'btn-error' : 'btn-ghost'}"
          onclick={async () => {
            settings = await settingsRepo.update({ theme: 'red-dark' });
            document.documentElement.setAttribute('data-theme', settings.theme);
          }}
        >
          Red Dark
        </button>
      </div>
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
      <h2 class="text-lg font-bold mb-2">Data Export</h2>
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

    <!-- Data Import -->
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <h2 class="text-lg font-bold mb-2">Data Import</h2>
      <p class="text-sm text-gray-400 mb-3">Restore data from a JSON backup file:</p>
      <div class="flex flex-col gap-2">
        <input
          type="file"
          accept=".json"
          class="file-input file-input-bordered file-input-error file-input-sm w-full"
          onchange={(e) => {
            const target = e.target as HTMLInputElement;
            importFile = target.files?.[0] ?? null;
            importStatus = null;
          }}
        />
        <button class="btn btn-error btn-sm self-start" onclick={handleImport}>
          Import Data
        </button>
        {#if importStatus}
          <p class="text-sm {importStatus.ok ? 'text-green-400' : 'text-red-400'}">
            {importStatus.message}
          </p>
        {/if}
      </div>
    </div>

    <!-- About -->
    <div class="card bg-base-200 border border-red-900/20 p-4">
      <h2 class="text-lg font-bold mb-2">About Third-Life</h2>
      <p class="text-sm text-gray-400">
        Third-Life — A gamified anti-procrastination PWA for the 84-day study plan.
      </p>
      <div class="mt-3 space-y-1 text-xs text-gray-500">
        <p><span class="font-bold">Version:</span> 0.1.0</p>
        <p><span class="font-bold">Stack:</span> SvelteKit 5, Dexie.js, Chart.js, daisyUI</p>
        <p><span class="font-bold">Storage:</span> All data stored locally in your browser (IndexedDB)</p>
        <p><span class="font-bold">Plan:</span> 84-day study plan with English, Spanish, Japanese &amp; Music</p>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="card bg-base-200 border border-red-700/40 p-4">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-lg font-bold text-red-400">Danger Zone</h2>
        <button
          class="btn btn-ghost btn-xs text-gray-500"
          onclick={() => (showDangerZone = !showDangerZone)}
        >
          {showDangerZone ? 'Hide' : 'Show'}
        </button>
      </div>

      {#if showDangerZone}
        <div class="border border-red-900/30 rounded-lg p-4 bg-red-950/20">
          {#if resetDone}
            <div class="text-center">
              <div class="text-4xl mb-2">&#128260;</div>
              <p class="text-green-400 font-bold">All data cleared!</p>
              <p class="text-xs text-gray-500 mt-1">Reloading to re-initialize...</p>
            </div>
          {:else if resetConfirm}
            <div class="text-center">
              <p class="text-red-400 font-bold mb-3">
                Are you sure? This will delete ALL your progress, XP, and achievements.
              </p>
              <div class="flex gap-2 justify-center">
                <button class="btn btn-outline btn-error btn-sm" onclick={() => (resetConfirm = false)}>
                  Cancel
                </button>
                <button class="btn btn-error btn-sm" onclick={handleResetAll}>
                  Yes, Reset Everything
                </button>
              </div>
            </div>
          {:else}
            <p class="text-sm text-gray-400 mb-3">
              Reset all data and start fresh. This cannot be undone.
            </p>
            <button class="btn btn-outline btn-error btn-sm" onclick={handleResetAll}>
              Reset All Data
            </button>
            <p class="text-xs text-gray-600 mt-2">
              All IndexedDB data will be cleared. The page will reload to re-seed default data.
            </p>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
