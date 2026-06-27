<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { isSeeded, importSeedData } from '$lib/db/repositories';

  let { children } = $props();

  let dbReady = $state(false);
  let seedError = $state(false);

  onMount(async () => {
    try {
      if (!(await isSeeded())) {
        await importSeedData();
      }
      dbReady = true;
    } catch (e) {
      console.error('Failed to initialize database:', e);
      seedError = true;
    }
  });
</script>

<div class="min-h-screen bg-base-100 text-base-content" data-theme="third-life">
  {#if !dbReady}
    <div class="flex items-center justify-center min-h-screen">
      {#if seedError}
        <div class="text-center p-8">
          <div class="text-6xl mb-4">⚠️</div>
          <h1 class="text-2xl font-bold mb-2 text-red-500">Database Error</h1>
          <p class="text-gray-400">Study plan not loaded. Reinstall the app.</p>
        </div>
      {:else}
        <div class="text-center">
          <div class="text-4xl mb-4 animate-pulse">⏳</div>
          <p class="text-gray-400">Loading your study plan...</p>
        </div>
      {/if}
    </div>
  {:else}
    <nav class="navbar bg-base-200 border-b border-red-900/30 px-4">
      <div class="navbar-start">
        <a href="/" class="btn btn-ghost text-xl font-bold tracking-tight">
          <span class="text-red-500">✦</span>
          <span class="ml-1">Third-Life</span>
        </a>
      </div>
      <div class="navbar-center hidden lg:flex">
        <ul class="menu menu-horizontal px-1 text-sm gap-1">
          <li><a href="/" class="hover:text-red-400 transition-colors">Dashboard</a></li>
          <li><a href="/progress" class="hover:text-red-400 transition-colors">Progress</a></li>
          <li><a href="/achievements" class="hover:text-red-400 transition-colors">Achievements</a></li>
          <li><a href="/recovery" class="hover:text-red-400 transition-colors">Recovery</a></li>
          <li><a href="/settings" class="hover:text-red-400 transition-colors">Settings</a></li>
        </ul>
      </div>
      <div class="navbar-end">
        <div class="dropdown dropdown-end">
          <button class="btn btn-ghost lg:hidden" aria-label="Navigation menu">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <ul class="menu menu-sm dropdown-content bg-base-200 rounded-box z-50 mt-3 w-52 p-2 shadow-xl border border-red-900/30">
            <li><a href="/">Dashboard</a></li>
            <li><a href="/progress">Progress</a></li>
            <li><a href="/achievements">Achievements</a></li>
            <li><a href="/recovery">Recovery</a></li>
            <li><a href="/settings">Settings</a></li>
          </ul>
        </div>
      </div>
    </nav>

    <main class="p-4 max-w-5xl mx-auto">
      {@render children()}
    </main>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    background: #0a0a0a;
    color: #e0e0e0;
  }
</style>
