<script lang="ts">
  import type { Task } from '$lib/types';
  import { DISCIPLINES } from '$lib/constants';

  interface Props {
    task: Task;
    completed: boolean;
    onComplete: (task: Task, timeSpentMin: number) => void;
    onUncomplete?: (task: Task) => void;
  }

  let { task, completed, onComplete, onUncomplete }: Props = $props();

  let timeElapsed = $state(0);
  let timerRunning = $state(false);
  let timerInterval: ReturnType<typeof setInterval> | undefined;
  let startTime = $state<number | null>(null);

  const discipline = $derived(DISCIPLINES.find((d) => d.id === task.discipline));

  const difficultyColors: Record<string, string> = {
    easy: 'badge-success',
    medium: 'badge-warning',
    hard: 'badge-error'
  };

  function toggleTimer() {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerInterval = undefined;
      timerRunning = false;
    } else {
      startTime = Date.now();
      timerRunning = true;
      timerInterval = setInterval(() => {
        timeElapsed = Math.floor((Date.now() - (startTime ?? Date.now())) / 1000);
      }, 1000);
    }
  }

  function handleToggle() {
    if (completed) {
      onUncomplete?.(task);
    } else {
      clearInterval(timerInterval);
      timerInterval = undefined;
      timerRunning = false;
      const minutes = Math.max(1, Math.round(timeElapsed / 60));
      onComplete(task, minutes);
    }
  }

  $effect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  });

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
</script>

<div
  class="card bg-base-200 border transition-all duration-300 {completed
    ? 'border-green-800/40 opacity-70'
    : 'border-red-900/20 hover:border-red-700/30'} p-3"
>
  <div class="flex items-start gap-3">
    <!-- Checkbox -->
    <button
      class="checkbox checkbox-error mt-1 cursor-pointer {completed ? 'checkbox-success' : ''}"
      class:checked={completed}
      onclick={handleToggle}
      aria-label={completed ? 'Unmark task' : 'Mark task complete'}
    />

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1 flex-wrap">
        <!-- Discipline badge -->
        {#if discipline}
          <span
            class="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
            style="background: {discipline.color}20; color: {discipline.color}"
          >
            <span>{discipline.emoji}</span>
            <span>{discipline.name}</span>
          </span>
        {/if}

        <!-- Difficulty badge -->
        <span class="badge badge-sm {difficultyColors[task.difficulty] ?? 'badge-ghost'}">
          {task.difficulty}
        </span>

        <!-- Duration -->
        <span class="text-xs text-gray-500">{task.durationMin} min</span>

        <!-- Category -->
        <span class="text-xs text-gray-600">{task.category}</span>
      </div>

      <p class="text-sm {completed ? 'line-through text-gray-500' : ''}">{task.description}</p>

      {#if task.detail}
        <p class="text-xs text-gray-500 mt-0.5 italic">{task.detail}</p>
      {/if}
    </div>

    <!-- Timer -->
    <div class="flex flex-col items-end gap-1">
      <button
        class="btn btn-ghost btn-xs {timerRunning ? 'text-red-400' : 'text-gray-500'}"
        onclick={toggleTimer}
        title={timerRunning ? 'Stop timer' : 'Start timer'}
      >
        {timerRunning ? '⏹' : '⏱'}
        <span class="font-mono text-xs">{formatTime(timeElapsed)}</span>
      </button>
    </div>
  </div>
</div>
