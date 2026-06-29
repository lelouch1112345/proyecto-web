<script lang="ts">
  import { onMount } from 'svelte';

  type TimerMode = 'focus' | 'break';
  type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

  interface Props {
    /** Duration in minutes for focus sessions */
    focusMinutes?: number;
    /** Duration in minutes for break sessions */
    breakMinutes?: number;
    /** Called when a focus session completes */
    onSessionComplete?: (minutes: number) => void;
    /** Compact mode for inline use in TaskCard */
    compact?: boolean;
  }

  let {
    focusMinutes: propFocusMinutes,
    breakMinutes = 5,
    onSessionComplete,
    compact = false
  }: Props = $props();

  // ─── State ───
  let mode = $state<TimerMode>('focus');
  let status = $state<TimerStatus>('idle');
  let timeLeft = $state(0); // seconds
  let totalSeconds = $state(0);
  let sessionsCompleted = $state(0);
  let interval: ReturnType<typeof setInterval> | undefined;
  let audioContext: AudioContext | undefined;

  // ─── Derived ───
  const effectiveFocusMinutes = $derived(propFocusMinutes ?? 40);
  const focusSeconds = $derived(effectiveFocusMinutes * 60);
  const breakSeconds = $derived(breakMinutes * 60);
  const progress = $derived(
    totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0
  );
  const isActive = $derived(status === 'running');
  const displayTime = $derived(formatTime(timeLeft));

  // ─── Init ───
  onMount(() => {
    resetTimer();
    return () => cleanup();
  });

  // React to focusMinutes prop changes when idle
  $effect(() => {
    // Access the prop to track it
    const _ = propFocusMinutes;
    if (status === 'idle' || status === 'finished') {
      resetTimer();
    }
  });

  function resetTimer() {
    if (mode === 'focus') {
      timeLeft = focusSeconds;
      totalSeconds = focusSeconds;
    } else {
      timeLeft = breakSeconds;
      totalSeconds = breakSeconds;
    }
  }

  // ─── Timer Logic ───
  function start() {
    if (status === 'idle' || status === 'finished') {
      // Reset and start fresh
      if (mode === 'focus') {
        timeLeft = focusSeconds;
        totalSeconds = focusSeconds;
      } else {
        timeLeft = breakSeconds;
        totalSeconds = breakSeconds;
      }
    }
    status = 'running';
    interval = setInterval(tick, 1000);
  }

  function pause() {
    if (status === 'running') {
      status = 'paused';
      clearInterval(interval);
      interval = undefined;
    }
  }

  function resume() {
    if (status === 'paused') {
      status = 'running';
      interval = setInterval(tick, 1000);
    }
  }

  function fullReset() {
    cleanup();
    status = 'idle';
    mode = 'focus';
    timeLeft = focusSeconds;
    totalSeconds = focusSeconds;
  }

  function tick() {
    if (timeLeft <= 1) {
      // Timer finished
      timeLeft = 0;
      status = 'finished';
      cleanup();
      playAlarm();

      if (mode === 'focus') {
        sessionsCompleted++;
        onSessionComplete?.(totalSeconds / 60);
        // Auto-switch to break
        setTimeout(() => {
          mode = 'break';
          timeLeft = breakSeconds;
          totalSeconds = breakSeconds;
          start();
        }, 2000);
      } else {
        // Break finished, switch back to focus
        setTimeout(() => {
          mode = 'focus';
          timeLeft = focusSeconds;
          totalSeconds = focusSeconds;
          start();
        }, 2000);
      }
    } else {
      timeLeft--;
    }
  }

  function cleanup() {
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
  }

  // ─── Audio Alarm ───
  function playAlarm() {
    try {
      if (!audioContext) {
        audioContext = new AudioContext();
      }
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.frequency.value = 880; // A5
      oscillator.type = 'sine';
      gain.gain.value = 0.3;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);

      // Play again after 0.7s
      setTimeout(() => {
        const osc2 = audioContext!.createOscillator();
        const gain2 = audioContext!.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext!.destination);
        osc2.frequency.value = 880;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(audioContext!.currentTime + 0.5);
      }, 700);
    } catch {
      // Audio not available, silently fail
    }
  }

  // ─── UI Helpers ───
  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function toggleMode() {
    if (status === 'idle' || status === 'finished') {
      mode = mode === 'focus' ? 'break' : 'focus';
      if (mode === 'focus') {
        timeLeft = focusSeconds;
        totalSeconds = focusSeconds;
      } else {
        timeLeft = breakSeconds;
        totalSeconds = breakSeconds;
      }
    }
  }

  function handleStartPauseResume() {
    if (status === 'running') {
      pause();
    } else if (status === 'paused') {
      resume();
    } else {
      start();
    }
  }

  // ─── Expose state for parent ───
  const exposed = $derived.by(() => ({
    isRunning: isActive,
    currentSession: mode,
    elapsedMinutes: Math.round((totalSeconds - timeLeft) / 60),
    sessionsCompleted,
    status
  }));

  // This is a workaround to expose state via a callback prop pattern
  // but for simplicity we just render inline.
</script>

<div class="timer {compact ? 'timer-compact' : ''}">
  <!-- Mode indicator -->
  <div class="flex items-center justify-center gap-2 mb-2">
    <button
      class="btn btn-xs {mode === 'focus' ? 'btn-error' : 'btn-ghost'}"
      onclick={() => { if (status !== 'running') { mode = 'focus'; timeLeft = focusSeconds; totalSeconds = focusSeconds; status = 'idle'; } }}
      disabled={status === 'running'}
    >
      🎯 Focus
    </button>
    <button
      class="btn btn-xs {mode === 'break' ? 'btn-success' : 'btn-ghost'}"
      onclick={() => { if (status !== 'running') { mode = 'break'; timeLeft = breakSeconds; totalSeconds = breakSeconds; status = 'idle'; } }}
      disabled={status === 'running'}
    >
      ☕ Break
    </button>
  </div>

  <!-- Timer Display -->
  <div class="text-center">
    <div class="timer-display {mode === 'focus' ? 'text-red-400' : 'text-green-400'} {isActive ? 'animate-pulse' : ''}">
      {displayTime}
    </div>

    <!-- Progress bar -->
    <div class="w-full bg-base-300 rounded-full h-1.5 mt-1 mb-2">
      <div
        class="h-1.5 rounded-full transition-all duration-1000 ease-linear {mode === 'focus' ? 'bg-red-500' : 'bg-green-500'}"
        style="width: {progress}%"
      ></div>
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-center gap-2">
      {#if status === 'idle' || status === 'finished'}
        <button class="btn btn-sm {mode === 'focus' ? 'btn-error' : 'btn-success'}" onclick={start}>
          ▶ Start {mode === 'focus' ? 'Focus' : 'Break'}
        </button>
      {:else if status === 'running'}
        <button class="btn btn-sm btn-warning" onclick={pause}>
          ⏸ Pause
        </button>
        <button class="btn btn-sm btn-ghost" onclick={fullReset}>
          ⏹ Reset
        </button>
      {:else if status === 'paused'}
        <button class="btn btn-sm {mode === 'focus' ? 'btn-error' : 'btn-success'}" onclick={resume}>
          ▶ Resume
        </button>
        <button class="btn btn-sm btn-ghost" onclick={fullReset}>
          ⏹ Reset
        </button>
      {/if}
    </div>

    <!-- Status text -->
    {#if status === 'finished'}
      <p class="text-xs text-yellow-400 mt-1 animate-bounce">
        {mode === 'focus' ? '🎉 Focus session complete! Take a break.' : '☕ Break over! Back to focus.'}
      </p>
    {:else if status === 'idle'}
      <p class="text-xs text-gray-500 mt-1">
        {mode === 'focus' ? `${effectiveFocusMinutes} min focus session` : `${breakMinutes} min break`}
      </p>
    {:else if status === 'paused'}
      <p class="text-xs text-gray-500 mt-1">Paused</p>
    {/if}

    <!-- Session counter -->
    {#if sessionsCompleted > 0}
      <p class="text-xs text-gray-600 mt-1">{sessionsCompleted} session{sessionsCompleted !== 1 ? 's' : ''} completed today</p>
    {/if}
  </div>
</div>

<style>
  .timer {
    user-select: none;
  }
  .timer-compact .timer-display {
    font-size: 1.25rem;
  }
  .timer-display {
    font-size: 2.5rem;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.1em;
  }
  @media (max-width: 640px) {
    .timer-display {
      font-size: 2rem;
    }
  }
</style>
