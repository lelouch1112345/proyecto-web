<script lang="ts">
  import type { CheckIn } from '$lib/types';

  interface Props {
    onCheckIn: (checkIn: Omit<CheckIn, 'id' | 'date' | 'createdAt'>) => void;
    saved?: boolean;
  }

  let { onCheckIn, saved = false }: Props = $props();

  let energy = $state(3);
  let focus = $state(3);
  let mood = $state(3);
  let sleepHrs = $state(7);
  let showSavedAnim = $state(false);

  $effect(() => {
    if (saved) {
      showSavedAnim = true;
      const t = setTimeout(() => { showSavedAnim = false; }, 1500);
      return () => clearTimeout(t);
    }
  });

  const labels: Record<string, string[]> = {
    energy: ['Exhausted', 'Tired', 'Okay', 'Energetic', 'Bursting'],
    focus: ['Scattered', 'Distracted', 'Normal', 'Focused', 'Laser'],
    mood: ['Terrible', 'Low', 'Neutral', 'Good', 'Great']
  };

  function handleSubmit() {
    onCheckIn({
      energy: energy as 1 | 2 | 3 | 4 | 5,
      focus: focus as 1 | 2 | 3 | 4 | 5,
      mood: mood as 1 | 2 | 3 | 4 | 5,
      sleepHrs
    });
  }

  function reset() {
    energy = 3;
    focus = 3;
    mood = 3;
    sleepHrs = 7;
  }
</script>

<div class="card bg-base-200 border border-red-900/20 p-4">
  <h3 class="font-bold text-sm mb-3 flex items-center gap-2">
    <span>📋</span>
    <span>Daily Check-In</span>
    {#if showSavedAnim}
      <span class="animate-success text-green-400 text-xs">✓ Saved!</span>
    {/if}
    {#if saved}
      <span class="badge badge-success badge-sm ml-auto">Saved</span>
    {/if}
  </h3>

  {#if !saved}
    <div class="space-y-3">
      <!-- Energy -->
      <div>
        <label class="text-xs text-gray-400 flex justify-between">
          <span>Energy</span>
          <span class="text-gray-500">{labels.energy[energy - 1]}</span>
        </label>
        <input type="range" min="1" max="5" bind:value={energy} class="range range-error range-xs" />
      </div>

      <!-- Focus -->
      <div>
        <label class="text-xs text-gray-400 flex justify-between">
          <span>Focus</span>
          <span class="text-gray-500">{labels.focus[focus - 1]}</span>
        </label>
        <input type="range" min="1" max="5" bind:value={focus} class="range range-error range-xs" />
      </div>

      <!-- Mood -->
      <div>
        <label class="text-xs text-gray-400 flex justify-between">
          <span>Mood</span>
          <span class="text-gray-500">{labels.mood[mood - 1]}</span>
        </label>
        <input type="range" min="1" max="5" bind:value={mood} class="range range-error range-xs" />
      </div>

      <!-- Sleep -->
      <div>
        <label class="text-xs text-gray-400 flex justify-between">
          <span>Sleep</span>
          <span class="text-gray-500">{sleepHrs} hrs</span>
        </label>
        <input type="range" min="0" max="12" step="0.5" bind:value={sleepHrs} class="range range-error range-xs" />
      </div>

      <button class="btn btn-error btn-sm w-full" onclick={handleSubmit}>
        Save Check-In
      </button>
    </div>
  {:else}
    <div class="text-center py-2 text-sm text-green-400">
      ✅ Check-in saved for today
    </div>
    <button class="btn btn-ghost btn-xs w-full mt-1" onclick={reset}>
      Re-do Check-In
    </button>
  {/if}
</div>
