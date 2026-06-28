<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { isSeeded, importSeedData } from '$lib/db/repositories';
  import { registerSW } from 'virtual:pwa-register';

  let { children } = $props();

  let dbReady = $state(false);
  let seedError = $state(false);

  // ─── PWA State ───
  let online = $state(true);
  let needRefresh = $state(false);
  let deferredPrompt: Event | null = $state(null);
  let installDismissedCount = $state(0);
  let showInstallBanner = $state(false);
  let updateSW: (() => Promise<void>) | null = $state(null);

  // ─── Event Handlers ───

  function handleOnline() { online = true; }
  function handleOffline() { online = false; }

  function handleBeforeInstall(e: Event) {
    e.preventDefault();
    deferredPrompt = e;
    if (installDismissedCount < 3) {
      showInstallBanner = true;
    }
  }

  function handleInstalled() {
    showInstallBanner = false;
    deferredPrompt = null;
  }

  function handleInstall() {
    if (!deferredPrompt) return;
    (deferredPrompt as any).prompt();
    (deferredPrompt as any).userChoice.then((choice: { outcome: string }) => {
      if (choice.outcome === 'accepted') {
        deferredPrompt = null;
        showInstallBanner = false;
      }
    });
  }

  function dismissInstall() {
    showInstallBanner = false;
    installDismissedCount++;
  }

  function handleUpdateReload() {
    updateSW?.();
  }

  // ─── Init ───

  onMount(() => {
    online = navigator.onLine;
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    initApp();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  });

  async function initApp() {
    try {
      if (!(await isSeeded())) {
        await importSeedData();
      }
      dbReady = true;
    } catch (e) {
      console.error('Failed to initialize database:', e);
      seedError = true;
    }

    try {
      const swUpdate = registerSW({
        immediate: true,
        onNeedRefresh() { needRefresh = true; },
        onOfflineReady() { console.log('App ready offline'); },
        onRegisterError(error: unknown) { console.error('SW registration failed:', error); }
      });
      if (typeof swUpdate === 'function') {
        updateSW = swUpdate;
      }
    } catch (e) {
      console.error('SW init error:', e);
    }

  }
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
    <!-- Offline indicator banner -->
    {#if !online}
      <div class="sticky top-0 z-40 w-full bg-amber-900/80 text-amber-200 text-center text-xs py-1 px-4 backdrop-blur-sm">
        You're offline — all features still work from cache
      </div>
    {/if}

    <!-- Update available toast -->
    {#if needRefresh}
      <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <div class="bg-red-900/90 border border-red-700/50 rounded-lg shadow-2xl backdrop-blur-sm p-4 flex items-center justify-between gap-3">
          <div class="text-sm text-red-100">
            <span class="font-semibold">Update available</span>
            <span class="text-red-300"> — reload to get the latest version</span>
          </div>
          <div class="flex gap-2 shrink-0">
            <button onclick={handleUpdateReload} class="btn btn-xs btn-error text-white font-bold">
              Reload
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Install banner -->
    {#if showInstallBanner}
      <div class="fixed bottom-0 left-0 right-0 z-50 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md">
        <div class="bg-gray-900/95 border-t md:border border-red-900/40 rounded-none md:rounded-lg shadow-2xl backdrop-blur-sm p-4 flex items-center justify-between gap-3">
          <div class="text-sm text-gray-200">
            <span class="font-semibold text-red-400">✦</span>
            <span> Install Third-Life for offline access</span>
          </div>
          <div class="flex gap-2 shrink-0">
            <button onclick={dismissInstall} class="btn btn-xs btn-ghost text-gray-400 hover:text-white">
              Not now
            </button>
            <button onclick={handleInstall} class="btn btn-xs bg-red-700 hover:bg-red-600 text-white font-bold border-none">
              Install
            </button>
          </div>
        </div>
      </div>
    {/if}

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
          <li><a href="/error-log" class="hover:text-red-400 transition-colors">Error Log</a></li>
          <li><a href="/settings" class="hover:text-red-400 transition-colors">Settings</a></li>
        </ul>
      </div>
      <div class="navbar-end flex items-center gap-2">
        <!-- Online/offline status dot -->
        <div class="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
          <span class="inline-block w-2 h-2 rounded-full {online ? 'bg-green-500' : 'bg-amber-500'}"></span>
          <span class="hidden md:inline">{online ? 'Online' : 'Offline'}</span>
        </div>
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
            <li><a href="/error-log">Error Log</a></li>
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
