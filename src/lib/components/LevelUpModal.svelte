<script lang="ts">
  import { LEVEL_TITLES } from '$lib/constants';
  import { fade, scale, fly } from 'svelte/transition';

  interface Props {
    level: number;
    title: string;
    onClose: () => void;
    open?: boolean;
  }

  let { level, title, onClose, open = true }: Props = $props();

  let visible = $state(open);
  let particles = $state<number[]>([]);
  let colors = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

  $effect(() => {
    if (open) {
      particles = Array.from({ length: 30 }, (_, i) => i);
      const timer = setTimeout(() => { particles = []; }, 2000);
      return () => clearTimeout(timer);
    }
  });

  function handleClose() {
    visible = false;
    setTimeout(onClose, 300);
  }
</script>

{#if visible}
  <!-- Confetti layer -->
  {#if particles.length}
    <div class="fixed inset-0 z-40 pointer-events-none overflow-hidden">
      {#each particles as _, i}
        <span
          class="confetti-dot"
          style="left: {Math.random() * 100}%; top: -5px; background: {colors[i % colors.length]}; animation: confetti-fall 2s ease-out {i * 0.06}s;"
        ></span>
      {/each}
    </div>
  {/if}

  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
    transition:fade={{ duration: 300 }}
    onclick={handleClose}
    role="dialog"
    aria-modal="true"
    aria-label="Level up!"
  >
    <!-- Card -->
    <div
      class="card bg-base-200 border border-gold-500/50 shadow-2xl shadow-gold-500/10 p-8 max-w-sm mx-4 text-center"
      transition:scale={{ start: 0.5, duration: 400 }}
      onclick={(e) => e.stopPropagation()}
    >
      <div transition:fly={{ y: -20, duration: 500, delay: 100 }}>
        <div class="text-6xl mb-2">🎉</div>
        <div class="text-4xl mb-2">⬆️</div>
        <h2 class="text-2xl font-bold text-gold-400 mb-1">Level Up!</h2>
        <p class="text-5xl font-black text-red-500 my-3">Lv.{level}</p>
        <p class="text-xl text-gold-300 font-semibold mb-4">{title}</p>

        {#if level < LEVEL_TITLES.length}
          <p class="text-sm text-gray-400 mb-6">
            Next: Lv.{level + 1} — {LEVEL_TITLES[level]?.title ?? '???'}
            ({LEVEL_TITLES[level]?.xpRequired ?? 0} XP needed)
          </p>
        {:else}
          <p class="text-sm text-yellow-400 mb-6">Maximum level reached! You are a legend.</p>
        {/if}

        <button class="btn btn-error" onclick={handleClose}>
          Continue
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .confetti-dot {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
  }
</style>
